import { Request, Response } from 'express';
import ChallengeRepositoryPg from '../../infrastructure/adapters/pg/ChallengeRepositoryPg';
import ChallengeService from '../../domain/services/ChallengeService';
import { createChallengeSchema, completeChallengeSchema } from '../validators/challengeSchemas';

const repo = new ChallengeRepositoryPg();
const service = new ChallengeService(repo);

const create = async (req: Request, res: Response) => {
  try {
    const parsed = createChallengeSchema.parse(req.body);
    const created = await service.createChallenge(parsed as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const accept = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.acceptChallenge(id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const rejectChallenge = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.rejectChallenge(id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

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

export default { create, accept, reject: rejectChallenge, complete };
