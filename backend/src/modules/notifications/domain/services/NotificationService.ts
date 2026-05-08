import INotificationRepository from '../ports/INotificationRepository';
import { Notification } from '../entities/Notification';
import { v4 as uuidv4 } from 'uuid';

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
    return this.repo.create(toCreate);
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
