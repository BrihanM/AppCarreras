import { Request, Response } from 'express';
import AccountRepositoryPg from '../../infrastructure/adapters/pg/AccountRepositoryPg';
import AuthService from '../../domain/services/AuthService';

const repo = new AccountRepositoryPg();
const service = new AuthService(repo, null);

const create = async (req: Request, res: Response) => {
  try {
    const account = await service.createAccount(req.body);
    res.status(201).json(account);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const getById = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const account = await service.getAccount(id);
    if (!account) return res.status(404).json({ error: 'Not found' });
    res.json(account);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const update = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.updateAccount(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await service.deleteAccount(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { create, getById, update, remove };
