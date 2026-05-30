import { Request, Response } from 'express';
import { ZodError } from 'zod';
import ChallengeRepositoryPg from '../../infrastructure/adapters/pg/ChallengeRepositoryPg';
import ChallengeService from '../../domain/services/ChallengeService';
import { createChallengeSchema, completeChallengeSchema, acceptChallengeSchema } from '../validators/challengeSchemas';
import { pool } from '../../infrastructure/db';

const repo = new ChallengeRepositoryPg();
const service = new ChallengeService(repo);

const ensureAdmin = (req: Request): boolean => {
  const auth = (req as any).user;
  if (auth && auth.role) return auth.role === 'admin';
  return auth && auth.username === 'admin';
};

const resolveRequesterUserId = async (req: Request): Promise<string | null> => {
  const authId = (req as any).user?.id ? String((req as any).user.id) : '';
  if (!authId) return null;
  const { rows } = await pool.query('SELECT id FROM users WHERE id = $1 OR account_id = $1 LIMIT 1', [authId]);
  return rows[0]?.id || null;
};

/**
 * create
 * Crea un `Challenge` validando con `createChallengeSchema`.
 */
const create = async (req: Request, res: Response) => {
  try {
    // DEBUG: log incoming body to investigate Zod validation failures
    // Remove this log after troubleshooting
    // eslint-disable-next-line no-console
    console.log('[challenges.create] body:', JSON.stringify(req.body));
    const parsed = createChallengeSchema.parse(req.body);
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const payload = {
      ...parsed,
      challenger_id: requesterUserId,
    };
    const created = await service.createChallenge(payload as any);
    res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof ZodError) {
      // Zod exposes `issues` with detailed validation errors
      return res.status(400).json({ error: err.issues });
    }
    res.status(400).json({ error: err.message });
  }
};

/**
 * list
 * Endpoint para listar challenges con paginación simples: `?limit=&page=`
 */
const list = async (req: Request, res: Response) => {
  try {
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });

    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const includeOpen = req.query.include_open !== 'false';
    // Join users to include challenger/challenged names and normalize keys to camelCase
    const q = `
      SELECT c.*, u1.name AS challenger_name, u2.name AS challenged_name,
             v1.plate AS challenger_plate, v2.plate AS challenged_plate
      FROM challenges c
      LEFT JOIN users u1 ON u1.id = c.challenger_id
      LEFT JOIN users u2 ON u2.id = c.challenged_id
      LEFT JOIN vehicles v1 ON v1.id = c.challenger_vehicle_id
      LEFT JOIN vehicles v2 ON v2.id = c.challenged_vehicle_id
      WHERE (
        c.challenger_id = $1
        OR c.challenged_id = $1
        OR (${includeOpen ? 'c.challenged_id IS NULL' : 'FALSE'})
      )
      ORDER BY c.created_at DESC LIMIT $2 OFFSET $3
    `;
    const { rows } = await pool.query(q, [requesterUserId, limit, offset]);

    // Normalize snake_case DB rows to frontend-friendly camelCase and map `state` -> `status`
    const data = rows.map((r: any) => ({
      id: r.id,
      challengerId: r.challenger_id,
      challengedId: r.challenged_id,
      challengerVehicleId: r.challenger_vehicle_id,
      challengedVehicleId: r.challenged_vehicle_id,
      careerType: r.career_type,
      status: r.state,
      winnerId: r.winner_id,
      agreedLocation: r.agreed_location,
      agreedDate: r.agreed_date,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      challengerName: r.challenger_name,
      challengedName: r.challenged_name,
      challengerPlate: r.challenger_plate,
      challengedPlate: r.challenged_plate,
      isOpen: !r.challenged_id,
    }));

    res.json({ success: true, message: 'Challenges listed', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * accept
 * Acepta un `Challenge` por id.
 */
const accept = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });
    const parsed = acceptChallengeSchema.parse(req.body || {});
    const updated = await service.acceptChallenge(id, requesterUserId, parsed.challenged_vehicle_id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * rejectChallenge
 * Rechaza un `Challenge` por id.
 */
const rejectChallenge = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const requesterUserId = await resolveRequesterUserId(req);
    if (!requesterUserId) return res.status(401).json({ error: 'Unauthorized' });
    const updated = await service.rejectChallenge(id, requesterUserId);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * complete
 * Completa un `Challenge` indicando el `winner_id`.
 */
const complete = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    // Accept both snake_case `winner_id` and camelCase `winnerId` from clients
    const body = {
      winner_id: (req.body && (req.body.winner_id || req.body.winnerId)) || undefined,
      notes: req.body && req.body.notes,
    };
    // DEBUG: log incoming complete requests
    // eslint-disable-next-line no-console
    console.log('[challenges.complete] id:', id, 'body:', JSON.stringify(body));
    const parsed = completeChallengeSchema.parse(body);
    const updated = await service.completeChallenge(id, parsed.winner_id);
    res.json(updated);
  } catch (err: any) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.issues });
    }
    // eslint-disable-next-line no-console
    console.error('[challenges.complete] error:', err);
    res.status(400).json({ error: err.message });
  }
};

/**
 * adminList
 * Lista retos para administración con filtros.
 */
const adminList = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 20));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;

    const state = req.query.status ? String(req.query.status) : null;
    const userId = req.query.user_id ? String(req.query.user_id) : null;
    const search = req.query.search ? String(req.query.search) : null;

    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (state) {
      if (state === 'active') {
        whereParts.push(`c.state IN ('pending','accepted')`);
      } else {
        whereParts.push(`c.state = $${idx++}`);
        values.push(state);
      }
    }
    if (userId) {
      whereParts.push(`(c.challenger_id = $${idx} OR c.challenged_id = $${idx})`);
      values.push(userId);
      idx += 1;
    }
    if (search) {
      whereParts.push(`(u1.name ILIKE $${idx} OR u2.name ILIKE $${idx})`);
      values.push(`%${search}%`);
      idx += 1;
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const q = `
      SELECT
        c.*, u1.name AS challenger_name, u2.name AS challenged_name,
        v1.plate AS challenger_plate, v2.plate AS challenged_plate
      FROM challenges c
      LEFT JOIN users u1 ON u1.id = c.challenger_id
      LEFT JOIN users u2 ON u2.id = c.challenged_id
      LEFT JOIN vehicles v1 ON v1.id = c.challenger_vehicle_id
      LEFT JOIN vehicles v2 ON v2.id = c.challenged_vehicle_id
      ${where}
      ORDER BY c.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);

    const { rows } = await pool.query(q, values);
    const data = rows.map((r: any) => ({
      id: r.id,
      challengerId: r.challenger_id,
      challengedId: r.challenged_id,
      challengerVehicleId: r.challenger_vehicle_id,
      challengedVehicleId: r.challenged_vehicle_id,
      status: r.state,
      winnerId: r.winner_id,
      agreedLocation: r.agreed_location,
      agreedDate: r.agreed_date,
      notes: r.notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      challengerName: r.challenger_name,
      challengedName: r.challenged_name,
      challengerPlate: r.challenger_plate,
      challengedPlate: r.challenged_plate,
    }));

    res.json({ success: true, message: 'Admin challenges listed', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminUpdate
 * Actualiza estado/datos de un reto desde panel admin.
 */
const adminUpdate = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    const allowedStates = ['pending', 'accepted', 'rejected', 'completed'];
    const payload: any = {};
    if (typeof req.body.status !== 'undefined') payload.state = req.body.status;
    if (typeof req.body.state !== 'undefined') payload.state = req.body.state;
    if (typeof req.body.winnerId !== 'undefined') payload.winner_id = req.body.winnerId;
    if (typeof req.body.winner_id !== 'undefined') payload.winner_id = req.body.winner_id;
    if (typeof req.body.notes !== 'undefined') payload.notes = req.body.notes;
    if (typeof req.body.agreedLocation !== 'undefined') payload.agreed_location = req.body.agreedLocation;
    if (typeof req.body.agreed_location !== 'undefined') payload.agreed_location = req.body.agreed_location;
    if (typeof req.body.agreedDate !== 'undefined') payload.agreed_date = req.body.agreedDate;
    if (typeof req.body.agreed_date !== 'undefined') payload.agreed_date = req.body.agreed_date;

    if (payload.state && !allowedStates.includes(String(payload.state))) {
      return res.status(400).json({ error: 'Invalid challenge status' });
    }

    const updated = await repo.update(id, payload);
    res.json({ success: true, message: 'Challenge updated', data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * adminDelete
 * Elimina un reto desde panel admin.
 */
const adminDelete = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    await repo.delete(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { create, list, accept, reject: rejectChallenge, complete, adminList, adminUpdate, adminDelete };
