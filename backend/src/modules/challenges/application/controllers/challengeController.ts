import { Request, Response } from 'express';
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
    const parsed = createChallengeSchema.parse(req.body);
    const created = await service.createChallenge(parsed as any);
    res.status(201).json(created);
  } catch (err: any) {
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
    const q = 'SELECT * FROM challenges ORDER BY created_at DESC LIMIT $1 OFFSET $2';
    const { rows } = await pool.query(q, [limit, offset]);
    res.json({ success: true, message: 'Challenges listed', data: rows });
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
    const parsed = completeChallengeSchema.parse(req.body);
    const updated = await service.completeChallenge(id, parsed.winner_id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default { create, list, accept, reject: rejectChallenge, complete };
