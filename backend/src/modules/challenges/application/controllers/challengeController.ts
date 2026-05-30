import { Request, Response } from 'express';
import { ZodError } from 'zod';
import ChallengeRepositoryPg from '../../infrastructure/adapters/pg/ChallengeRepositoryPg';
import ChallengeService from '../../domain/services/ChallengeService';
import { createChallengeSchema, completeChallengeSchema } from '../validators/challengeSchemas';
import { pool } from '../../infrastructure/db';

const repo = new ChallengeRepositoryPg();
const service = new ChallengeService(repo);

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
    const created = await service.createChallenge(parsed as any);
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
    const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 10));
    const page = Math.max(1, Number(req.query.page) || 1);
    const offset = (page - 1) * limit;
    // Join users to include challenger/challenged names and normalize keys to camelCase
    const q = `
      SELECT c.*, u1.name AS challenger_name, u2.name AS challenged_name
      FROM challenges c
      LEFT JOIN users u1 ON u1.id = c.challenger_id
      LEFT JOIN users u2 ON u2.id = c.challenged_id
      ORDER BY c.created_at DESC LIMIT $1 OFFSET $2
    `;
    const { rows } = await pool.query(q, [limit, offset]);

    // Normalize snake_case DB rows to frontend-friendly camelCase and map `state` -> `status`
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
    const updated = await service.acceptChallenge(id);
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
    const updated = await service.rejectChallenge(id);
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

export default { create, list, accept, reject: rejectChallenge, complete };
