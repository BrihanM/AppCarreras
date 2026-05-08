import IVehicleRepository from '../../../domain/ports/IVehicleRepository';
import { Vehicle } from '../../../domain/entities/Vehicle';
import { pool } from '../../db';

class VehicleRepositoryPg implements IVehicleRepository {
  async create(v: Partial<Vehicle>): Promise<Vehicle> {
    const q = `INSERT INTO vehicles (id,user_id,make,model,plate,active) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`;
    const values = [v.id, v.user_id, v.make, v.model, v.plate, v.active || false];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async findById(id: string): Promise<Vehicle | null> {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findByUserId(userId: string): Promise<Vehicle[]> {
    const { rows } = await pool.query('SELECT * FROM vehicles WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  async countByUserId(userId: string): Promise<number> {
    const { rows } = await pool.query('SELECT COUNT(*)::int as count FROM vehicles WHERE user_id = $1', [userId]);
    return rows[0].count || 0;
  }

  async deactivateAllForUser(userId: string): Promise<void> {
    await pool.query('UPDATE vehicles SET active = false WHERE user_id = $1', [userId]);
  }

  async activate(id: string): Promise<Vehicle> {
    const { rows } = await pool.query('UPDATE vehicles SET active = true, updated_at = NOW() WHERE id = $1 RETURNING *', [id]);
    return rows[0];
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);
  }
}

export default VehicleRepositoryPg;
