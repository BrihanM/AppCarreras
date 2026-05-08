import INotificationRepository from '../../../domain/ports/INotificationRepository';
import { Notification } from '../../../domain/entities/Notification';
import { pool } from '../../db';

class NotificationRepositoryPg implements INotificationRepository {
  async create(n: Partial<Notification>): Promise<Notification> {
    const q = `INSERT INTO notifications (id,user_id,type,message,is_read,reference_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const values = [n.id, n.user_id, n.type, n.message, n.is_read || false, n.reference_id || null];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async findById(id: string): Promise<Notification | null> {
    const { rows } = await pool.query('SELECT * FROM notifications WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const { rows } = await pool.query('SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  async markRead(id: string): Promise<Notification> {
    const { rows } = await pool.query('UPDATE notifications SET is_read = true WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
  }
}

export default NotificationRepositoryPg;
