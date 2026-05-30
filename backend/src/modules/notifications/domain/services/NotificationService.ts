import INotificationRepository from '../ports/INotificationRepository';
import { Notification } from '../entities/Notification';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

class NotificationService {
  private repo: INotificationRepository;

  constructor(repo: INotificationRepository) {
    this.repo = repo;
  }
  /**
   * @fileoverview Servicio de dominio para `Notification`.
   * Encapsula la lógica de creación, listado y marcado como leído de
   * notificaciones. Emite eventos WebSocket tras crear notificaciones.
   */

  /**
   * createNotification
   * Crea una notificación para un usuario.
   * - Genera un `id` si no se entrega.
   * - Asegura que `is_read` tenga valor por defecto `false`.
   * - Persiste la notificación y emite evento `notification` al usuario.
   *
   * @param {Partial<Notification>} attrs - Atributos de la notificación.
   * @returns {Promise<Notification>} Notificación creada.
   */
  async createNotification(attrs: Partial<Notification>): Promise<Notification> {
    const id = attrs.id || uuidv4();
    const toCreate: Partial<Notification> = {
      ...attrs,
      id,
      is_read: attrs.is_read || false,
    };
    const created = await this.repo.create(toCreate);
    try {
      const io = getIo();
      if (io) {
        io.to(`user:${created.user_id}`).emit('notification:new', created);
        console.debug(`[notifications] emitted notification:${created.id} to room user:${created.user_id}`);
      }
    } catch (e) {
      // ignore socket emission errors
    }
    return created;
  }

  /**
   * listForUser
   * Lista las notificaciones de un usuario.
   * @param {string} userId - Identificador del usuario.
   * @returns {Promise<Notification[]>} Array de notificaciones.
   */
  async listForUser(userId: string): Promise<Notification[]> {
    return this.repo.listByUser(userId);
  }

  /**
   * markAsRead
   * Marca una notificación como leída.
   * @param {string} id - Identificador de la notificación.
   * @returns {Promise<Notification>} Notificación actualizada.
   */
  async markAsRead(id: string): Promise<Notification> {
    const updated = await this.repo.markRead(id);
    try {
      const io = getIo();
      if (io && updated?.user_id) io.to(`user:${updated.user_id}`).emit('notification:read', updated);
    } catch (e) {
      // ignore socket emission errors
    }
    return updated;
  }

  /**
   * markAllForUser
   * Marca todas las notificaciones de un usuario como leídas.
   */
  async markAllForUser(userId: string): Promise<void> {
    await this.repo.markAll(userId);
    try {
      const io = getIo();
      if (io) io.to(`user:${userId}`).emit('notification:all-read', { userId });
    } catch (e) {
      // ignore socket emission errors
    }
    return;
  }

  /**
   * getById
   * Recupera una notificación por su id.
   * @param {string} id - Identificador.
   * @returns {Promise<Notification|null>} Notificación o `null`.
   */
  async getById(id: string): Promise<Notification | null> {
    return this.repo.findById(id);
  }
}

export default NotificationService;
