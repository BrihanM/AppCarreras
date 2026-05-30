import { Request, Response } from 'express';
import NotificationRepositoryPg from '../../infrastructure/adapters/pg/NotificationRepositoryPg';
import NotificationService from '../../domain/services/NotificationService';
import { createNotificationSchema } from '../validators/notificationSchemas';
import { pool } from '../../../../config/db';

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
    // Prefer explicit query user_id, otherwise resolve from authenticated subject.
    let userId = String(req.query.user_id || req.query.userId || '');

    if (!userId) {
      const authId = (req as any).user?.id ? String((req as any).user.id) : '';
      if (authId) {
        // authId may be account_id; resolve to users.id first, fallback to authId as users.id
        const { rows } = await pool.query('SELECT id FROM users WHERE account_id = $1 OR id = $1 LIMIT 1', [authId]);
        userId = rows[0]?.id || authId;
      }
    }

    if (!userId) return res.status(400).json({ error: 'user_id required' });
    await service.markAllForUser(userId);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { list, create, markRead, markAll };
