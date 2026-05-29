import IUserRepository from '../../../domain/ports/IUserRepository';
import { User } from '../../../domain/entities/User';
import { pool } from '../../db';

/**
 * Repositorio PostgreSQL para `User`.
 */
class UserRepositoryPg implements IUserRepository {
  /**
   * create
   * Inserta un nuevo usuario.
   */
  async create(user: Partial<User>): Promise<User> {
    const q = `INSERT INTO users (id, name, bio, avatar_url, local_zone, city_area, state_zone, country_zone, rank, category_id, victories, defeats, consecutive_challenges, state, account_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`;
    const values = [
      user.id,
      user.name,
      (user as any).bio || null,
      (user as any).avatar_url || null,
      user.local_zone || null,
      user.city_area || null,
      user.state_zone || null,
      user.country_zone || null,
      user.rank || 'D',
      user.category_id || null,
      user.victories || 0,
      user.defeats || 0,
      user.consecutive_challenges || 0,
      user.state || null,
      user.account_id || null,
    ];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  /**
   * findById
   * Recupera un usuario por id.
   */
  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  /**
   * findByAccountId
   * Busca un usuario por `account_id`.
   */
  async findByAccountId(accountId: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE account_id = $1', [accountId]);
    return rows[0] || null;
  }

  /**
   * findAll
   * Lista todos los usuarios ordenados por creación.
   */
  async findAll(): Promise<User[]> {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  }

  /**
   * update
   * Actualiza un usuario existentes y devuelve la fila actualizada.
   */
  async update(id: string, attrs: Partial<User>): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('User not found');
    const updated = { ...existing, ...attrs } as any;
    const q = `UPDATE users SET name=$1,bio=$2,avatar_url=$3,local_zone=$4,city_area=$5,state_zone=$6,country_zone=$7,rank=$8,category_id=$9,victories=$10,defeats=$11,consecutive_challenges=$12,state=$13,account_id=$14,updated_at=NOW() WHERE id=$15 RETURNING *`;
    const values = [
      updated.name,
      (updated as any).bio ?? null,
      (updated as any).avatar_url ?? null,
      updated.local_zone,
      updated.city_area,
      updated.state_zone,
      updated.country_zone,
      updated.rank,
      updated.category_id,
      updated.victories,
      updated.defeats,
      updated.consecutive_challenges,
      updated.state,
      updated.account_id,
      id,
    ];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  /**
   * delete
   * Elimina un usuario por id.
   */
  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

export default UserRepositoryPg;
