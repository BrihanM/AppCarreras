import { Request, Response } from 'express';
import UserRepositoryPg from '../../infrastructure/adapters/pg/UserRepositoryPg';
import UserService from '../../domain/services/UserService';
import { createUserSchema, updateUserSchema } from '../validators/userSchemas';

const repo = new UserRepositoryPg();
const service = new UserService(repo);

/**
 * create
 * Crea un nuevo `User`.
 * - Valida la entrada con `createUserSchema`.
 * - Devuelve 201 y el usuario creado.
 */
const create = async (req: Request, res: Response) => {
  try {
    const parsed = createUserSchema.parse(req.body);
    const user = await service.createUser(parsed as any);
    res.status(201).json(user);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * getById
 * Recupera un `User` por id. Responde 404 si no existe.
 */
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

/**
 * update
 * Actualiza un `User` validando con `updateUserSchema`.
 */
const update = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = updateUserSchema.parse(req.body);
    const updated = await service.updateUser(id, parsed as any);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * remove
 * Elimina un `User` por id. Responde 204 en caso de éxito.
 */
const remove = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await service.deleteUser(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * list
 * Lista todos los usuarios.
 */
const list = async (_req: Request, res: Response) => {
  try {
    const items = await service.listUsers();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { create, getById, update, remove, list };
