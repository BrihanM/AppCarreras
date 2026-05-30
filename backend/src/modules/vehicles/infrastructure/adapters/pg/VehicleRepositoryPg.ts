import IVehicleRepository from '../../../domain/ports/IVehicleRepository';
import { Vehicle } from '../../../domain/entities/Vehicle';
import { pool } from '../../db';

/**
 * Repositorio PostgreSQL para `Vehicle`.
 * Implementa las operaciones necesarias por el servicio de dominio.
 */
class VehicleRepositoryPg implements IVehicleRepository {
  /**
   * create
   * Inserta un nuevo vehículo en la tabla `vehicles`.
   */
  async create(v: Partial<Vehicle>): Promise<Vehicle> {
    const q = `
      INSERT INTO vehicles (id,user_id,make,model,brand_catalog_id,model_catalog_id,plate,active)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      RETURNING *
    `;
    const values = [
      v.id,
      v.user_id,
      v.make,
      v.model,
      v.brand_catalog_id || null,
      v.model_catalog_id || null,
      v.plate,
      v.active || false,
    ];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  /**
   * findById
   * Busca un vehículo por `id`.
   */
  async findById(id: string): Promise<Vehicle | null> {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    return rows[0] || null;
  }

  /**
   * findByUserId
   * Devuelve los vehículos de un usuario, ordenados por creación.
   */
  async findByUserId(userId: string): Promise<Vehicle[]> {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  /**
   * listAll
   * Lista vehículos para administración con filtros opcionales.
   */
  async listAll(params?: { userId?: string; search?: string; page?: number; limit?: number }): Promise<Vehicle[]> {
    const page = Math.max(1, Number(params?.page || 1));
    const limit = Math.max(1, Math.min(100, Number(params?.limit || 20)));
    const offset = (page - 1) * limit;

    const whereParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (params?.userId) {
      whereParts.push(`v.user_id = $${idx++}`);
      values.push(params.userId);
    }
    if (params?.search) {
      whereParts.push(`(v.make ILIKE $${idx} OR v.model ILIKE $${idx} OR v.plate ILIKE $${idx} OR u.name ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx += 1;
    }

    const where = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
    const q = `
      SELECT v.*, u.name AS user_name
      FROM vehicles v
      LEFT JOIN users u ON u.id = v.user_id
      ${where}
      ORDER BY v.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(limit, offset);
    const { rows } = await pool.query(q, values);
    return rows;
  }

  /**
   * countByUserId
   * Cuenta los vehículos asociados a un usuario.
   */
  async countByUserId(userId: string): Promise<number> {
    const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM vehicles WHERE user_id = $1', [userId]);
    return rows[0].count || 0;
  }

  /**
   * deactivateAllForUser
   * Desactiva (`active = false`) todos los vehículos de un usuario.
   */
  async deactivateAllForUser(userId: string): Promise<void> {
    await pool.query('UPDATE vehicles SET active = false WHERE user_id = $1', [userId]);
  }

  /**
   * activate
   * Marca un vehículo como activo y devuelve la fila actualizada.
   */
  async activate(id: string): Promise<Vehicle> {
    const { rows } = await pool.query('UPDATE vehicles SET active = true, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  /**
   * update
   * Actualiza los campos editables de un vehículo.
   */
  async update(id: string, attrs: Partial<Vehicle>): Promise<Vehicle> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Vehicle not found');
    const next = { ...existing, ...attrs } as any;
    const q = `
      UPDATE vehicles
      SET user_id=$1, make=$2, model=$3, brand_catalog_id=$4, model_catalog_id=$5, plate=$6, active=$7, updated_at=NOW()
      WHERE id=$8
      RETURNING *
    `;
    const values = [
      next.user_id,
      next.make,
      next.model,
      next.brand_catalog_id || null,
      next.model_catalog_id || null,
      next.plate,
      next.active ?? false,
      id,
    ];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  /**
   * delete
   * Elimina un vehículo por id.
   */
  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
  }
}

export default VehicleRepositoryPg;
