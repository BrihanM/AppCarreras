import { Notification } from '../entities/Notification';

export default interface INotificationRepository {
  create(n: Partial<Notification>): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  listByUser(userId: string): Promise<Notification[]>;
  markRead(id: string): Promise<Notification>;
  /** Marca todas las notificaciones de un usuario como leídas. */
  markAll(userId: string): Promise<void>;
  delete(id: string): Promise<void>;
}
