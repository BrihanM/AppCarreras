import INotificationRepository from '../ports/INotificationRepository';
import { Notification } from '../entities/Notification';
import { v4 as uuidv4 } from 'uuid';
import { getIo } from '../../../../socket';

class NotificationService {
  private repo: INotificationRepository;

  constructor(repo: INotificationRepository) {
    this.repo = repo;
  }

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
        io.to(`user:${created.user_id}`).emit('notification', created);
      }
    } catch (e) {
      // swallow socket errors
    }
    return created;
  }

  async listForUser(userId: string): Promise<Notification[]> {
    return this.repo.listByUser(userId);
  }

  async markAsRead(id: string): Promise<Notification> {
    return this.repo.markRead(id);
  }

  async getById(id: string): Promise<Notification | null> {
    return this.repo.findById(id);
  }
}

export default NotificationService;
