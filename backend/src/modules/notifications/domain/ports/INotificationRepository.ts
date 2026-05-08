import { Notification } from '../entities/Notification';

export default interface INotificationRepository {
  create(n: Partial<Notification>): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  listByUser(userId: string): Promise<Notification[]>;
  markRead(id: string): Promise<Notification>;
  delete(id: string): Promise<void>;
}
