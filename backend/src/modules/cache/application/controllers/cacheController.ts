import { Request, Response } from 'express';
import { pool } from '../../../../config/db';

/**
 * Controlador simple para gestionar reglas de invalidación de cache.
 * Endpoints protegidos: sólo usuarios con username 'admin' pueden modificar.
 */

const ensureAdmin = (req: Request) => {
  const auth = (req as any).user;
  // Prefer role if available (added by migration), otherwise allow username 'admin'
  if (auth && auth.role) return auth.role === 'admin';
  return auth && auth.username === 'admin';
};

const list = async (_req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM invalidation_rules ORDER BY created_at DESC');
    res.json({ success: true, message: 'Rules listed', data: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

const createRule = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const { name, mutating_endpoint, invalidates } = req.body;
    const inv = Array.isArray(invalidates) ? invalidates : (typeof invalidates === 'string' ? invalidates.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    const q = `INSERT INTO invalidation_rules (name, mutating_endpoint, invalidates) VALUES ($1,$2,$3) RETURNING *`;
    const { rows } = await pool.query(q, [name || null, mutating_endpoint, JSON.stringify(inv)]);
    res.status(201).json({ success: true, message: 'Rule created', data: rows[0] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const updateRule = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    const { name, mutating_endpoint, invalidates } = req.body;
    const inv = Array.isArray(invalidates) ? invalidates : (typeof invalidates === 'string' ? invalidates.split(',').map((s: string) => s.trim()).filter(Boolean) : []);
    const q = `UPDATE invalidation_rules SET name=$1, mutating_endpoint=$2, invalidates=$3, updated_at=NOW() WHERE id=$4 RETURNING *`;
    const { rows } = await pool.query(q, [name || null, mutating_endpoint, JSON.stringify(inv), id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, message: 'Rule updated', data: rows[0] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

const remove = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    await pool.query('DELETE FROM invalidation_rules WHERE id=$1', [id]);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export default { list, createRule, updateRule, remove };
