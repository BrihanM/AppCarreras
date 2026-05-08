import { Request, Response } from 'express';
import AccountRepositoryPg from '../../infrastructure/adapters/pg/AccountRepositoryPg';
import AuthService from '../../domain/services/AuthService';
import { createAccountSchema } from '../validators/accountSchemas';

const repo = new AccountRepositoryPg();
const service = new AuthService(repo, null);

/**
 * create
 * Controlador para crear una nueva `Account`.
 * - Valida la petición con `createAccountSchema` y delega en `AuthService.createAccount`.
 * - Responde con 201 y la entidad creada.
 */
const create = async (req: Request, res: Response) => {
  try {
    const parsed = createAccountSchema.parse(req.body);
    const account = await service.createAccount(parsed as any);
    res.status(201).json(account);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * getById
 * Recupera una `Account` por id.
 * - Responde 404 si no se encuentra.
 */
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

/**
 * update
 * Actualiza una `Account`.
 */
const update = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.updateAccount(id, req.body);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * remove
 * Elimina una `Account` por id. Responde 204 en caso de éxito.
 */
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
