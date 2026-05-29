import { Request, Response } from 'express';
import UserRepositoryPg from '../../infrastructure/adapters/pg/UserRepositoryPg';
import UserService from '../../domain/services/UserService';
import { createUserSchema, updateUserSchema } from '../validators/userSchemas';
import { pool } from '../../../../config/db';
import bcrypt from 'bcrypt';

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
 * updateMe
 * Actualiza el usuario vinculado a la cuenta autenticada.
 */
const updateMe = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth || !auth.id) return res.status(401).json({ error: 'Unauthorized' });
    // Map frontend payload (camelCase) to DB shape (snake_case)
    const body = { ...req.body } as any;
    if (body.firstName || body.lastName) {
      const first = body.firstName ?? '';
      const last = body.lastName ?? '';
      body.name = `${String(first).trim()} ${String(last).trim()}`.trim();
    }
    if (body.city) body.city_area = body.city;
    if (body.avatarUrl) body.avatar_url = body.avatarUrl;
    if (body.bio) body.bio = body.bio;

    // If account fields are present (username/email/password/photo), perform a single transaction
    const accountFields: any = {};
    if (typeof body.username !== 'undefined') accountFields.username = body.username;
    if (typeof body.email !== 'undefined') accountFields.email = body.email;
    if (typeof body.password !== 'undefined') accountFields.password = body.password;
    if (typeof body.avatarUrl !== 'undefined') accountFields.photo = body.avatarUrl;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update account if needed
      let accountUpdated: any = null;
      if (Object.keys(accountFields).length) {
        const updates: string[] = [];
        const values: any[] = [];
        let idx = 1;
        if (accountFields.username) { updates.push(`username=$${idx++}`); values.push(accountFields.username); }
        if (accountFields.email) { updates.push(`email=$${idx++}`); values.push(accountFields.email); }
        if (accountFields.password) { const hashed = await bcrypt.hash(accountFields.password, 10); updates.push(`password_hash=$${idx++}`); values.push(hashed); }
        if (accountFields.photo) { updates.push(`photo=$${idx++}`); values.push(accountFields.photo); }
        if (updates.length) {
          const q = `UPDATE accounts SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${idx} RETURNING *`;
          values.push(String(auth.id));
          const { rows } = await client.query(q, values);
          accountUpdated = rows[0];
        }
      }

      // Update user profile
      const parsed = updateUserSchema.parse(body);
      const existing = await service.getByAccountId(String(auth.id));
      if (!existing) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      // Build update for users table using parsed fields
      const userUpdates: string[] = [];
      const userValues: any[] = [];
      let ui = 1;
      if (typeof parsed.name !== 'undefined') { userUpdates.push(`name=$${ui++}`); userValues.push(parsed.name); }
      if (typeof parsed.bio !== 'undefined') { userUpdates.push(`bio=$${ui++}`); userValues.push(parsed.bio); }
      if (typeof parsed.avatar_url !== 'undefined') { userUpdates.push(`avatar_url=$${ui++}`); userValues.push(parsed.avatar_url); }
      if (typeof parsed.local_zone !== 'undefined') { userUpdates.push(`local_zone=$${ui++}`); userValues.push(parsed.local_zone); }
      if (typeof parsed.city_area !== 'undefined') { userUpdates.push(`city_area=$${ui++}`); userValues.push(parsed.city_area); }
      if (typeof parsed.state_zone !== 'undefined') { userUpdates.push(`state_zone=$${ui++}`); userValues.push(parsed.state_zone); }
      if (typeof parsed.country_zone !== 'undefined') { userUpdates.push(`country_zone=$${ui++}`); userValues.push(parsed.country_zone); }
      if (typeof parsed.rank !== 'undefined') { userUpdates.push(`rank=$${ui++}`); userValues.push(parsed.rank); }
      if (typeof parsed.category_id !== 'undefined') { userUpdates.push(`category_id=$${ui++}`); userValues.push(parsed.category_id); }
      if (typeof parsed.victories !== 'undefined') { userUpdates.push(`victories=$${ui++}`); userValues.push(parsed.victories); }
      if (typeof parsed.defeats !== 'undefined') { userUpdates.push(`defeats=$${ui++}`); userValues.push(parsed.defeats); }
      if (typeof parsed.consecutive_challenges !== 'undefined') { userUpdates.push(`consecutive_challenges=$${ui++}`); userValues.push(parsed.consecutive_challenges); }
      if (typeof parsed.state !== 'undefined') { userUpdates.push(`state=$${ui++}`); userValues.push(parsed.state); }

      let userUpdated: any = null;
      if (userUpdates.length) {
        const uq = `UPDATE users SET ${userUpdates.join(',')}, updated_at=NOW() WHERE account_id=$${ui} RETURNING *`;
        userValues.push(String(auth.id));
        const { rows: ur } = await client.query(uq, userValues);
        userUpdated = ur[0];
      }

      await client.query('COMMIT');

      // Merge response: prefer updated user row, and updated account if any
      const result = { account: accountUpdated, user: userUpdated };
      res.json({ success: true, message: 'Profile updated', data: result });
    } catch (err: any) {
      try { await client.query('ROLLBACK'); } catch (e) {}
      throw err;
    } finally {
      client.release();
    }
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
const list = async (req: Request, res: Response) => {
  try {
    const page = parseInt(String(req.query.page || '1'), 10) || 1;
    const limit = parseInt(String(req.query.limit || '10'), 10) || 10;
    const city = req.query.city ? String(req.query.city) : null;
    const rank = req.query.rank ? String(req.query.rank) : null;

    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;
    if (city) { whereParts.push(`city_area ILIKE $${idx++}`); values.push(`%${city}%`); }
    if (rank) { whereParts.push(`rank = $${idx++}`); values.push(rank); }
    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    // Order by rank weight (A highest) then victories
    const order = `ORDER BY CASE rank WHEN 'A' THEN 4 WHEN 'B' THEN 3 WHEN 'C' THEN 2 WHEN 'D' THEN 1 ELSE 0 END DESC, victories DESC`;

    const offset = (page - 1) * limit;
    const q = `SELECT * FROM users ${where} ${order} LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);

    const { rows } = await pool.query(q, values);

    // total count for pagination
    const countQ = `SELECT COUNT(*)::int as total FROM users ${where}`;
    const { rows: cr } = await pool.query(countQ, values.slice(0, values.length - 2));
    const total = cr[0]?.total || rows.length;

    res.json({ success: true, message: 'Users listed', data: rows, total });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * getMe
 * Devuelve el `User` vinculado a la cuenta autenticada (req.user.id).
 */
const getMe = async (req: Request, res: Response) => {
  try {
    const auth = (req as any).user;
    if (!auth || !auth.id) return res.status(401).json({ error: 'Unauthorized' });
    const user = await service.getByAccountId(String(auth.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, message: 'User profile', data: user });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { create, getById, update, remove, list, getMe, updateMe };
