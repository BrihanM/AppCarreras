import { Request, Response } from 'express';
import NotificationRepositoryPg from '../../infrastructure/adapters/pg/NotificationRepositoryPg';
import NotificationService from '../../domain/services/NotificationService';
import { createNotificationSchema } from '../validators/notificationSchemas';

const repo = new NotificationRepositoryPg();
const service = new NotificationService(repo);

/**
 * list
 * Lista notificaciones para un usuario. Requiere `user_id` como query param.
 */
const list = async (req: Request, res: Response) => {
  try {
    const userId = String(req.query.user_id || req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'user_id query param required' });
    const items = await service.listForUser(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * create
 * Crea una notificación y la emite al usuario correspondiente.
 */
const create = async (req: Request, res: Response) => {
  try {
    const parsed = createNotificationSchema.parse(req.body);
    const created = await service.createNotification(parsed as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * markRead
 * Marca una notificación como leída por id.
 */
const markRead = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.markAsRead(id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default { list, create, markRead };
