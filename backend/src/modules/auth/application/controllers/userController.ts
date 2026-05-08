import { Request, Response } from 'express';
import UserRepositoryPg from '../../infrastructure/adapters/pg/UserRepositoryPg';
import AccountRepositoryPg from '../../infrastructure/adapters/pg/AccountRepositoryPg';
import AuthService from '../../domain/services/AuthService';

const userRepo = new UserRepositoryPg();
const accountRepo = new AccountRepositoryPg();
const service = new AuthService(accountRepo, userRepo);

const create = async (req: Request, res: Response) => {
  try {
    const user = await service.createUser(req.body);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const getById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = await service.getUser(id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    res.json(user);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.updateUser(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await service.deleteUser(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const list = async (_req: Request, res: Response) => {
  try {
    const items = await userRepo.findAll();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { create, getById, update, remove, list };
