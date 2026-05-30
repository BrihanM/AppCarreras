import { Request, Response } from 'express';
import VehicleRepositoryPg from '../../infrastructure/adapters/pg/VehicleRepositoryPg';
import VehicleService from '../../domain/services/VehicleService';
import { createVehicleSchema, updateVehicleSchema } from '../validators/vehicleSchemas';
import { pool } from '../../../../config/db';

const repo = new VehicleRepositoryPg();
const service = new VehicleService(repo);

const ensureAdmin = (req: Request): boolean => {
  const auth = (req as any).user;
  if (auth && auth.role) return auth.role === 'admin';
  return auth && auth.username === 'admin';
};

const resolveCatalogPair = async (input: {
  make?: string;
  model?: string;
  brand_catalog_id?: string;
  model_catalog_id?: string;
}): Promise<{ make: string; model: string; brand_catalog_id: string; model_catalog_id: string }> => {
  if (input.brand_catalog_id && input.model_catalog_id) {
    const q = `
      SELECT b.id AS brand_id, b.name AS brand_name, m.id AS model_id, m.name AS model_name
      FROM vehicle_catalog b
      JOIN vehicle_catalog m ON m.parent_id = b.id AND m.type = 'model'
      WHERE b.id = $1 AND b.type = 'brand' AND b.is_active = TRUE
        AND m.id = $2 AND m.is_active = TRUE
      LIMIT 1
    `;
    const { rows } = await pool.query(q, [input.brand_catalog_id, input.model_catalog_id]);
    if (!rows.length) throw new Error('Brand/model pair is invalid or inactive');
    return {
      make: rows[0].brand_name,
      model: rows[0].model_name,
      brand_catalog_id: rows[0].brand_id,
      model_catalog_id: rows[0].model_id,
    };
  }

  if (!input.make || !input.model) throw new Error('make and model are required');
  const q = `
    SELECT b.id AS brand_id, b.name AS brand_name, m.id AS model_id, m.name AS model_name
    FROM vehicle_catalog b
    JOIN vehicle_catalog m ON m.parent_id = b.id AND m.type = 'model'
    WHERE b.type = 'brand' AND b.is_active = TRUE
      AND m.is_active = TRUE
      AND LOWER(b.name) = LOWER($1)
      AND LOWER(m.name) = LOWER($2)
    LIMIT 1
  `;
  const { rows } = await pool.query(q, [input.make, input.model]);
  if (!rows.length) throw new Error('Brand/model not found or inactive in catalog');
  return {
    make: rows[0].brand_name,
    model: rows[0].model_name,
    brand_catalog_id: rows[0].brand_id,
    model_catalog_id: rows[0].model_id,
  };
};

/**
 * createForUser
 * Crea un `Vehicle` para un usuario específico.
 * - Valida con `createVehicleSchema`.
 * - Aplica reglas desde `VehicleService` (máx 3, único activo).
 */
const createForUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const parsed = createVehicleSchema.parse(req.body);
    const resolved = await resolveCatalogPair(parsed as any);
    const created = await service.createVehicle(userId, {
      ...parsed,
      make: resolved.make,
      model: resolved.model,
      brand_catalog_id: resolved.brand_catalog_id,
      model_catalog_id: resolved.model_catalog_id,
    } as any);
    res.status(201).json(created);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * listForUser
 * Lista los vehículos de un usuario.
 */
const listForUser = async (req: Request, res: Response) => {
  try {
    const userId = String(req.params.id);
    const items = await service.listByUser(userId);
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * activate
 * Activa un vehículo (desactiva los demás del mismo usuario).
 */
const activate = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const updated = await service.activateVehicle(id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * remove
 * Elimina un vehículo por id.
 */
const remove = async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    await service.deleteVehicle(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminList
 * Lista vehículos para administración con filtros opcionales.
 */
const adminList = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const userId = req.query.user_id ? String(req.query.user_id) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const data = await service.listAllVehicles({ userId, search, page, limit });
    res.json({ success: true, message: 'Vehicles listed', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminGetById
 * Recupera un vehículo por id para administración.
 */
const adminGetById = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    const item = await repo.findById(id);
    if (!item) return res.status(404).json({ error: 'Vehicle not found' });
    res.json({ success: true, message: 'Vehicle found', data: item });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminUpdate
 * Actualiza cualquier vehículo desde panel admin.
 */
const adminUpdate = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    const parsed = updateVehicleSchema.parse(req.body);
    let patch: any = { ...parsed };

    if ((parsed as any).brand_catalog_id || (parsed as any).model_catalog_id || (parsed as any).make || (parsed as any).model) {
      const resolved = await resolveCatalogPair(parsed as any);
      patch = {
        ...patch,
        make: resolved.make,
        model: resolved.model,
        brand_catalog_id: resolved.brand_catalog_id,
        model_catalog_id: resolved.model_catalog_id,
      };
    }

    const updated = await service.updateVehicle(id, patch as any);
    res.json({ success: true, message: 'Vehicle updated', data: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * adminRemove
 * Elimina cualquier vehículo desde panel admin.
 */
const adminRemove = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    await service.deleteVehicle(id);
    res.status(204).send();
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * listBrands
 * Lista marcas del catálogo para formularios.
 */
const listBrands = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const q = `
      SELECT id, name, type, parent_id, is_active, created_at, updated_at
      FROM vehicle_catalog
      WHERE type = 'brand' ${activeOnly ? 'AND is_active = TRUE' : ''}
      ORDER BY name ASC
    `;
    const { rows } = await pool.query(q);
    res.json({ success: true, message: 'Brands listed', data: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * listModels
 * Lista modelos, opcionalmente filtrados por marca.
 */
const listModels = async (req: Request, res: Response) => {
  try {
    const activeOnly = req.query.activeOnly !== 'false';
    const brandId = req.query.brand_id ? String(req.query.brand_id) : null;
    const values: any[] = [];
    let idx = 1;
    const whereParts = [`m.type = 'model'`];
    if (activeOnly) whereParts.push('m.is_active = TRUE');
    if (brandId) {
      whereParts.push(`m.parent_id = $${idx++}`);
      values.push(brandId);
    }
    const q = `
      SELECT m.id, m.name, m.type, m.parent_id, m.is_active, m.created_at, m.updated_at,
             b.name AS brand_name
      FROM vehicle_catalog m
      LEFT JOIN vehicle_catalog b ON b.id = m.parent_id
      WHERE ${whereParts.join(' AND ')}
      ORDER BY m.name ASC
    `;
    const { rows } = await pool.query(q, values);
    res.json({ success: true, message: 'Models listed', data: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminListCatalog
 * Lista entradas del catálogo (marca/modelo) para administración.
 */
const adminListCatalog = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const type = req.query.type ? String(req.query.type) : null;
    const parentId = req.query.parent_id ? String(req.query.parent_id) : null;
    const search = req.query.search ? String(req.query.search) : null;

    const values: any[] = [];
    const whereParts: string[] = [];
    let idx = 1;

    if (type) {
      whereParts.push(`c.type = $${idx++}`);
      values.push(type);
    }
    if (parentId) {
      whereParts.push(`c.parent_id = $${idx++}`);
      values.push(parentId);
    }
    if (search) {
      whereParts.push(`c.name ILIKE $${idx++}`);
      values.push(`%${search}%`);
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const q = `
      SELECT c.id, c.name, c.type, c.parent_id, c.is_active, c.created_at, c.updated_at, p.name AS parent_name
      FROM vehicle_catalog c
      LEFT JOIN vehicle_catalog p ON p.id = c.parent_id
      ${where}
      ORDER BY c.type ASC, c.name ASC
    `;
    const { rows } = await pool.query(q, values);
    res.json({ success: true, message: 'Catalog listed', data: rows });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * adminCreateCatalog
 * Crea marca o modelo en catálogo.
 */
const adminCreateCatalog = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const type = String(req.body.type || '').toLowerCase();
    const name = String(req.body.name || '').trim();
    const parentId = req.body.parent_id ? String(req.body.parent_id) : null;
    const isActive = typeof req.body.is_active === 'boolean' ? req.body.is_active : true;

    if (!name) return res.status(400).json({ error: 'name is required' });
    if (!['brand', 'model'].includes(type)) return res.status(400).json({ error: 'type must be brand or model' });
    if (type === 'model' && !parentId) return res.status(400).json({ error: 'parent_id is required for model' });
    if (type === 'brand' && parentId) return res.status(400).json({ error: 'brand cannot have parent_id' });

    if (type === 'model') {
      const chk = await pool.query(`SELECT id FROM vehicle_catalog WHERE id=$1 AND type='brand'`, [parentId]);
      if (!chk.rows.length) return res.status(400).json({ error: 'parent_id must reference an existing brand' });
    }

    const q = `
      INSERT INTO vehicle_catalog (name, type, parent_id, is_active)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const { rows } = await pool.query(q, [name, type, parentId, isActive]);
    res.status(201).json({ success: true, message: 'Catalog item created', data: rows[0] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * adminUpdateCatalog
 * Actualiza/activa/desactiva una marca o modelo.
 */
const adminUpdateCatalog = async (req: Request, res: Response) => {
  try {
    if (!ensureAdmin(req)) return res.status(403).json({ error: 'Forbidden' });
    const id = String(req.params.id);
    const existing = await pool.query('SELECT * FROM vehicle_catalog WHERE id=$1', [id]);
    if (!existing.rows.length) return res.status(404).json({ error: 'Catalog item not found' });

    const curr = existing.rows[0];
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : curr.name;
    const isActive = typeof req.body.is_active === 'boolean' ? req.body.is_active : curr.is_active;
    const parentId = typeof req.body.parent_id !== 'undefined' ? req.body.parent_id : curr.parent_id;

    if (!name) return res.status(400).json({ error: 'name cannot be empty' });
    if (curr.type === 'brand' && parentId) return res.status(400).json({ error: 'brand cannot have parent_id' });
    if (curr.type === 'model') {
      if (!parentId) return res.status(400).json({ error: 'model requires parent_id' });
      const chk = await pool.query(`SELECT id FROM vehicle_catalog WHERE id=$1 AND type='brand'`, [parentId]);
      if (!chk.rows.length) return res.status(400).json({ error: 'parent_id must reference an existing brand' });
    }

    const q = `
      UPDATE vehicle_catalog
      SET name=$1, parent_id=$2, is_active=$3, updated_at=NOW()
      WHERE id=$4
      RETURNING *
    `;
    const { rows } = await pool.query(q, [name, parentId, isActive, id]);
    res.json({ success: true, message: 'Catalog item updated', data: rows[0] });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default {
  createForUser,
  listForUser,
  activate,
  remove,
  adminList,
  adminGetById,
  adminUpdate,
  adminRemove,
  listBrands,
  listModels,
  adminListCatalog,
  adminCreateCatalog,
  adminUpdateCatalog,
};
