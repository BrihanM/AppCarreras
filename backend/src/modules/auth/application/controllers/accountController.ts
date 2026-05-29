import { Request, Response } from 'express';
import AccountRepositoryPg from '../../infrastructure/adapters/pg/AccountRepositoryPg';
import AuthService from '../../domain/services/AuthService';
import { createAccountSchema } from '../validators/accountSchemas';
import { pool } from '../../../../config/db';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const repo = new AccountRepositoryPg();
const service = new AuthService(repo, null);

/**
 * create
 * Controlador para crear una nueva `Account`.
 * - Valida la petición con `createAccountSchema` y delega en `AuthService.createAccount`.
 * - Responde con 201 y la entidad creada.
 */
const create = async (req: Request, res: Response) => {
  // Creación atómica de account + user (si se envía `user` en el body).
  const client = await pool.connect();
  try {
    const parsed = createAccountSchema.parse(req.body);
    const userPayload = (req.body as any).user;

    await client.query('BEGIN');

    // Hash password y crear account
    const hashed = await bcrypt.hash(parsed.password, 10);
    const accountId = uuidv4();
    const insertAccQ = `INSERT INTO accounts (id, username, email, password_hash, photo, last_connection)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const accValues = [accountId, parsed.username, parsed.email, hashed, parsed.photo || null, null];
    const { rows: accRows } = await client.query(insertAccQ, accValues);
    const account = accRows[0];

    let user = null;
    if (userPayload) {
      const userId = userPayload.id || uuidv4();
      const insertUserQ = `INSERT INTO users (id, name, local_zone, city_area, state_zone, country_zone, rank, category_id, victories, defeats, consecutive_challenges, state, account_id)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`;
      const userValues = [
        userId,
        userPayload.name,
        userPayload.local_zone || null,
        userPayload.city_area || null,
        userPayload.state_zone || null,
        userPayload.country_zone || null,
        userPayload.rank || null,
        userPayload.category_id || null,
        userPayload.victories ?? 0,
        userPayload.defeats ?? 0,
        userPayload.consecutive_challenges ?? 0,
        userPayload.state || null,
        accountId,
      ];
      const { rows: userRows } = await client.query(insertUserQ, userValues);
      user = userRows[0];
    }

    await client.query('COMMIT');

    // Responder con estructura consistente para frontend (no emite tokens aquí)
    res.status(201).json({ success: true, message: 'Account and user created', data: { account, user } });
  } catch (err: any) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
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
 * updateMe
 * Actualiza la cuenta vinculada al usuario autenticado.
 */
const updateMe = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth || !auth.id) return res.status(401).json({ error: 'Unauthorized' });
    // Map possible frontend fields
    const body = { ...req.body } as any;
    if (body.avatarUrl) body.photo = body.avatarUrl;
    if (body.password) (body as any).password = body.password;
    const updated = await service.updateAccount(String(auth.id), body as any);
    res.json({ success: true, message: 'Account updated', data: updated });
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

export default { create, getById, update, remove, updateMe };
