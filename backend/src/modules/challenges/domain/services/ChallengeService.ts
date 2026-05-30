import IChallengeRepository from '../ports/IChallengeRepository';
import { Challenge, ChallengeState } from '../entities/Challenge';
import { v4 as uuidv4 } from 'uuid';
import UserRepositoryPg from '../../../users/infrastructure/adapters/pg/UserRepositoryPg';
import NotificationRepositoryPg from '../../../notifications/infrastructure/adapters/pg/NotificationRepositoryPg';
import { getIo } from '../../../../socket';


/**
 * @fileoverview
 * Servicio de dominio para `Challenge` (retos). Contiene la lógica de negocio
 * relacionada con crear, aceptar, rechazar y completar retos entre usuarios.
 *
 * Reglas principales aplicadas aquí:
 * - Un usuario no puede retarse a sí mismo.
 * - No debe existir más de un reto activo entre los mismos dos usuarios.
 * - Solo usuarios del mismo `rank` pueden retarse.
 * - Al completarse un reto se actualizan estadísticas de usuarios y se crean
 *   notificaciones.
 */


class ChallengeService {
  private repo: IChallengeRepository;

  constructor(repo: IChallengeRepository) {
    this.repo = repo;
  }

  async createChallenge(attrs: Partial<Challenge>): Promise<Challenge> {
    /**
     * createChallenge
     * Crea un nuevo reto entre dos usuarios.
     * - Verifica que existan `challenger_id` y `challenged_id` y que sean diferentes.
     * - Genera un `id` si no se proporciona y marca el estado inicial como `pending`.
     * - Enforce: no puede existir un reto activo entre ambos usuarios.
     * - Enforce: solo usuarios con el mismo `rank` pueden retarse.
     * - Crea una notificación para el usuario retado y emite evento WebSocket.
     *
     * @param {Partial<Challenge>} attrs - Atributos parciales del reto.
     * @returns {Promise<Challenge>} El reto creado.
     */
    if (!attrs.challenger_id || !attrs.challenged_id) {
      throw new Error('Both challenger and challenged user ids are required');
    }
    if (attrs.challenger_id === attrs.challenged_id) {
      throw new Error('A user cannot challenge themself');
    }
    const id = attrs.id || uuidv4();
    const toCreate: Partial<Challenge> = {
      ...attrs,
      id,
      state: 'pending',
    };
    // Business rule: no more than one active challenge between same users
    const exists = await this.repo.existsActiveBetween(toCreate.challenger_id!, toCreate.challenged_id!);
    if (exists) throw new Error('There is already an active challenge between these users');

    // Business rule: only users with same rank can challenge
    const userRepo = new UserRepositoryPg();
    const challenger = await userRepo.findById(toCreate.challenger_id!);
    const challenged = await userRepo.findById(toCreate.challenged_id!);
    if (!challenger || !challenged) throw new Error('Challenger or challenged user not found');
    if ((challenger.rank || '') !== (challenged.rank || '')) throw new Error('Users must have the same rank to challenge');

    const created = await this.repo.create(toCreate);

    // Create notification for challenged user
    const notifRepo = new NotificationRepositoryPg();
    try {
      const createdNotif = await notifRepo.create({ user_id: toCreate.challenged_id!, type: 'challenge_sent', message: `You have been challenged by ${challenger.name}`, reference_id: created.id } as any);
      try { const io = getIo(); if (io) io.to(`user:${toCreate.challenged_id}`).emit('notification:new', createdNotif); } catch (e) {}
    } catch (e) {
      console.error('[challenges] failed to create notification for challenged user', e);
    }
    try {
      const io = getIo();
      if (io) io.to(`user:${toCreate.challenged_id}`).emit('challenge:created', created);
    } catch (e) {}

    return created;
  }

  async acceptChallenge(id: string): Promise<Challenge> {
    /**
     * acceptChallenge
     * Acepta un reto pendiente.
     * - Verifica que el reto exista y esté en estado `pending`.
     * - Actualiza el estado a `accepted`.
     * - Crea una notificación para el retador y emite un evento websocket.
     *
     * @param {string} id - Identificador del reto a aceptar.
     * @returns {Promise<Challenge>} El reto actualizado.
     */
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.state !== 'pending') throw new Error('Only pending challenges can be accepted');
    const updated = await this.repo.update(id, { state: 'accepted' as ChallengeState });
    // Notify challenger
    const userRepo = new UserRepositoryPg();
    const challenger = await userRepo.findById(updated.challenger_id);
    const notifRepo = new NotificationRepositoryPg();
    try {
      const createdNotif2 = await notifRepo.create({ user_id: updated.challenger_id, type: 'challenge_accepted', message: `Your challenge was accepted`, reference_id: updated.id } as any);
      try { const io = getIo(); if (io) io.to(`user:${updated.challenger_id}`).emit('notification:new', createdNotif2); } catch (e) {}
    } catch (e) {
      console.error('[challenges] failed to create notification on accept', e);
    }
    try { const io = getIo(); if (io) io.to(`user:${updated.challenger_id}`).emit('challenge:updated', updated); } catch (e) {}
    return updated;
  }

  async rejectChallenge(id: string): Promise<Challenge> {
    /**
     * rejectChallenge
     * Rechaza un reto pendiente.
     * - Verifica existencia y estado `pending`.
     * - Cambia estado a `rejected` y notifica al retador.
     *
     * @param {string} id - Identificador del reto a rechazar.
     * @returns {Promise<Challenge>} El reto actualizado.
     */
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.state !== 'pending') throw new Error('Only pending challenges can be rejected');
    const updated = await this.repo.update(id, { state: 'rejected' as ChallengeState });
    const notifRepo = new NotificationRepositoryPg();
    try {
      const createdNotif3 = await notifRepo.create({ user_id: updated.challenger_id, type: 'challenge_rejected', message: `Your challenge was rejected`, reference_id: updated.id } as any);
      try { const io = getIo(); if (io) io.to(`user:${updated.challenger_id}`).emit('notification:new', createdNotif3); } catch (e) {}
    } catch (e) {
      console.error('[challenges] failed to create notification on reject', e);
    }
    try { const io = getIo(); if (io) io.to(`user:${updated.challenger_id}`).emit('challenge:updated', updated); } catch (e) {}
    return updated;
  }

  async completeChallenge(id: string, winner_id: string): Promise<Challenge> {
    /**
     * completeChallenge
     * Marca un reto como completado y registra el ganador.
     * - Verifica que el reto exista y esté en estado `accepted`.
     * - Valida que `winner_id` sea uno de los participantes.
     * - Actualiza estado a `completed` y asigna `winner_id`.
     * - Actualiza estadísticas de `victories`, `defeats` y `consecutive_challenges`.
     * - Crea notificaciones para ganador y perdedor y emite eventos websocket.
     *
     * @param {string} id - Identificador del reto.
     * @param {string} winner_id - Identificador del usuario ganador.
     * @returns {Promise<Challenge>} El reto finalizado.
     */
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.state !== 'accepted') throw new Error('Only accepted challenges can be completed');
    if (winner_id !== challenge.challenger_id && winner_id !== challenge.challenged_id) {
      throw new Error('Winner must be one of the participants');
    }
    const updated = await this.repo.update(id, { state: 'completed' as ChallengeState, winner_id });

    // Update users statistics: victories/defeats and consecutive_challenges
    const userRepo = new UserRepositoryPg();
    const winner = await userRepo.findById(winner_id);
    const loserId = winner_id === challenge.challenger_id ? challenge.challenged_id : challenge.challenger_id;
    const loser = await userRepo.findById(loserId!);
    let updatedWinner: any = null;
    let updatedLoser: any = null;
    if (winner) {
      updatedWinner = await userRepo.update(winner.id, { victories: (winner.victories || 0) + 1, consecutive_challenges: (winner.consecutive_challenges || 0) + 1 } as any);
    }
    if (loser) {
      updatedLoser = await userRepo.update(loser.id, { defeats: (loser.defeats || 0) + 1, consecutive_challenges: 0 } as any);
    }

    // Rank promotion logic: promote if user has 3 consecutive wins
    try {
      const RANKS = ['D', 'C', 'B', 'A']; // ascending order
      if (updatedWinner) {
        const curr = String(updatedWinner.rank || 'D');
        const idx = RANKS.indexOf(curr);
        const consec = Number(updatedWinner.consecutive_challenges || 0);
        if (idx >= 0 && idx < RANKS.length - 1 && consec >= 3) {
          const newRank = RANKS[idx + 1];
          await userRepo.update(updatedWinner.id, { rank: newRank, consecutive_challenges: 0 } as any);
          // notify rank change
          const notifRepo = new NotificationRepositoryPg();
          try {
            const rankNotif = await notifRepo.create({ user_id: updatedWinner.id, type: 'rank_updated', message: `Congratulations! You have been promoted to rank ${newRank}`, reference_id: updated.id } as any);
            try { const io = getIo(); if (io) io.to(`user:${updatedWinner.id}`).emit('rank:updated', { userId: updatedWinner.id, rank: newRank }); if (io) io.to(`user:${updatedWinner.id}`).emit('notification:new', rankNotif); } catch (e) {}
          } catch (e) {
            console.error('[challenges] failed to create rank notification', e);
          }
        }
      }
    } catch (e) {
      // non-fatal: log and continue
      console.error('Rank promotion error', e);
    }

    // Notifications
    const notifRepo = new NotificationRepositoryPg();
    try {
      const winNotif = await notifRepo.create({ user_id: winner_id, type: 'challenge_completed', message: `You won the challenge`, reference_id: updated.id } as any);
      const loseNotif = await notifRepo.create({ user_id: loserId, type: 'challenge_completed', message: `You lost the challenge`, reference_id: updated.id } as any);
      try { const io = getIo(); if (io) { io.to(`user:${winner_id}`).emit('notification:new', winNotif); io.to(`user:${loserId}`).emit('notification:new', loseNotif); } } catch (e) {}
    } catch (e) {
      console.error('[challenges] failed to create completion notifications', e);
    }
    try { const io = getIo(); if (io) {
      io.to(`user:${winner_id}`).emit('challenge:completed', updated);
      io.to(`user:${loserId}`).emit('challenge:completed', updated);
    } } catch (e) {}

    return updated;
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    /**
     * getChallenge
     * Recupera un reto por su identificador.
     * @param {string} id - Identificador del reto.
     * @returns {Promise<Challenge|null>} El reto o `null` si no existe.
     */
    return this.repo.findById(id);
  }

  async listByUser(userId: string): Promise<Challenge[]> {
    /**
     * listByUser
     * Lista los retos relacionados con un usuario (tanto como retador como retado).
     * @param {string} userId - Identificador del usuario.
     * @returns {Promise<Challenge[]>} Array de retos.
     */
    return this.repo.listByUser(userId);
  }
}

export default ChallengeService;
