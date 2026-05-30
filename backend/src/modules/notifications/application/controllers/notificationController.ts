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
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 100));
    const itemsAll = await service.listForUser(userId);
    const total = itemsAll.length;
    const offset = (page - 1) * limit;
    const items = itemsAll.slice(offset, offset + limit);
    const pagination = {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
    res.json({ success: true, message: 'Notifications listed', data: items, pagination });
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

/**
 * markAll
 * Marca todas las notificaciones del usuario autenticado (o `user_id` query param).
 */
const markAll = async (req: Request, res: Response) => {
  try {
    // Prefer req.user (cookieAuth) but allow query param for scripts/tests
    const userId = (req as any).user?.id || String(req.query.user_id || req.query.userId || '');
    if (!userId) return res.status(400).json({ error: 'user_id required' });
    await service.markAllForUser(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { list, create, markRead, markAll };
