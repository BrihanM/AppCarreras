import IUserRepository from '../../../domain/ports/IUserRepository';
import { User } from '../../../domain/entities/User';
import { pool } from '../../db';

class UserRepositoryPg implements IUserRepository {
  async create(user: Partial<User>): Promise<User> {
    const q = `INSERT INTO users (id, name, local_zone, city_area, state_zone, country_zone, rank, category_id, victories, defeats, consecutive_challenges, state, account_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`;
    const values = [
      user.id,
      user.name,
      user.local_zone || null,
      user.city_area || null,
      user.state_zone || null,
      user.country_zone || null,
      user.rank || null,
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

  async findById(id: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async findByAccountId(accountId: string): Promise<User | null> {
    const { rows } = await pool.query('SELECT * FROM users WHERE account_id = $1', [accountId]);
    return rows[0] || null;
  }

  async findAll(): Promise<User[]> {
    const { rows } = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
    return rows;
  }

  async update(id: string, attrs: Partial<User>): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('User not found');
    const updated = { ...existing, ...attrs } as any;
    const q = `UPDATE users SET name=$1,local_zone=$2,city_area=$3,state_zone=$4,country_zone=$5,rank=$6,category_id=$7,victories=$8,defeats=$9,consecutive_challenges=$10,state=$11,account_id=$12,updated_at=NOW() WHERE id=$13 RETURNING *`;
    const values = [
      updated.name,
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

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
  }
}

export default UserRepositoryPg;
