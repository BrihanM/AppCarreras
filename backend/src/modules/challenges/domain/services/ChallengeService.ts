import IChallengeRepository from '../ports/IChallengeRepository';
import { Challenge, ChallengeState } from '../entities/Challenge';
import { v4 as uuidv4 } from 'uuid';
import UserRepositoryPg from '../../../users/infrastructure/adapters/pg/UserRepositoryPg';
import NotificationRepositoryPg from '../../../notifications/infrastructure/adapters/pg/NotificationRepositoryPg';
import { getIo } from '../../../../socket';


class ChallengeService {
  private repo: IChallengeRepository;

  constructor(repo: IChallengeRepository) {
    this.repo = repo;
  }

  async createChallenge(attrs: Partial<Challenge>): Promise<Challenge> {
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
    await notifRepo.create({ user_id: toCreate.challenged_id!, type: 'challenge_sent', message: `You have been challenged by ${challenger.name}`, reference_id: created.id } as any);
    try {
      const io = getIo();
      if (io) io.to(`user:${toCreate.challenged_id}`).emit('challenge:created', created);
    } catch (e) {}

    return created;
  }

  async acceptChallenge(id: string): Promise<Challenge> {
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.state !== 'pending') throw new Error('Only pending challenges can be accepted');
    const updated = await this.repo.update(id, { state: 'accepted' as ChallengeState });
    // Notify challenger
    const userRepo = new UserRepositoryPg();
    const challenger = await userRepo.findById(updated.challenger_id);
    const notifRepo = new NotificationRepositoryPg();
    await notifRepo.create({ user_id: updated.challenger_id, type: 'challenge_accepted', message: `Your challenge was accepted`, reference_id: updated.id } as any);
    try { const io = getIo(); if (io) io.to(`user:${updated.challenger_id}`).emit('challenge:updated', updated); } catch (e) {}
    return updated;
  }

  async rejectChallenge(id: string): Promise<Challenge> {
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new Error('Challenge not found');
    if (challenge.state !== 'pending') throw new Error('Only pending challenges can be rejected');
    const updated = await this.repo.update(id, { state: 'rejected' as ChallengeState });
    const notifRepo = new NotificationRepositoryPg();
    await notifRepo.create({ user_id: updated.challenger_id, type: 'challenge_rejected', message: `Your challenge was rejected`, reference_id: updated.id } as any);
    try { const io = getIo(); if (io) io.to(`user:${updated.challenger_id}`).emit('challenge:updated', updated); } catch (e) {}
    return updated;
  }

  async completeChallenge(id: string, winner_id: string): Promise<Challenge> {
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
    if (winner) {
      await userRepo.update(winner.id, { victories: (winner.victories || 0) + 1, consecutive_challenges: (winner.consecutive_challenges || 0) + 1 } as any);
    }
    if (loser) {
      await userRepo.update(loser.id, { defeats: (loser.defeats || 0) + 1, consecutive_challenges: 0 } as any);
    }

    // Notifications
    const notifRepo = new NotificationRepositoryPg();
    await notifRepo.create({ user_id: winner_id, type: 'challenge_completed', message: `You won the challenge`, reference_id: updated.id } as any);
    await notifRepo.create({ user_id: loserId, type: 'challenge_completed', message: `You lost the challenge`, reference_id: updated.id } as any);
    try { const io = getIo(); if (io) {
      io.to(`user:${winner_id}`).emit('challenge:completed', updated);
      io.to(`user:${loserId}`).emit('challenge:completed', updated);
    } } catch (e) {}

    return updated;
  }

  async getChallenge(id: string): Promise<Challenge | null> {
    return this.repo.findById(id);
  }

  async listByUser(userId: string): Promise<Challenge[]> {
    return this.repo.listByUser(userId);
  }
}

export default ChallengeService;
