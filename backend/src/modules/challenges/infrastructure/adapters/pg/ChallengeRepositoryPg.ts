import IChallengeRepository from '../../../domain/ports/IChallengeRepository';
import { Challenge } from '../../../domain/entities/Challenge';
import { pool } from '../../db';

class ChallengeRepositoryPg implements IChallengeRepository {
  async create(c: Partial<Challenge>): Promise<Challenge> {
    const q = `INSERT INTO challenges (id, challenger_id, challenged_id, career_type, challenger_vehicle_id, challenged_vehicle_id, state, winner_id, agreed_location, agreed_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`;
    const values = [
      c.id,
      c.challenger_id,
      c.challenged_id,
      c.career_type || null,
      c.challenger_vehicle_id,
      c.challenged_vehicle_id,
      c.state || 'pending',
      c.winner_id || null,
      c.agreed_location || null,
      c.agreed_date || null,
      c.notes || null,
    ];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async findById(id: string): Promise<Challenge | null> {
    const { rows } = await pool.query('SELECT * FROM challenges WHERE id = $1', [id]);
    return rows[0] || null;
  }

  async update(id: string, attrs: Partial<Challenge>): Promise<Challenge> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Challenge not found');
    const updated = { ...existing, ...attrs } as any;
    const q = `UPDATE challenges SET state=$1,winner_id=$2,agreed_location=$3,agreed_date=$4,notes=$5,updated_at=NOW() WHERE id=$6 RETURNING *`;
    const values = [updated.state, updated.winner_id || null, updated.agreed_location || null, updated.agreed_date || null, updated.notes || null, id];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  async listByUser(userId: string): Promise<Challenge[]> {
    const { rows } = await pool.query('SELECT * FROM challenges WHERE challenger_id = $1 OR challenged_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  async existsActiveBetween(userA: string, userB: string): Promise<boolean> {
    const q = `SELECT 1 FROM challenges WHERE (
      (challenger_id = $1 AND challenged_id = $2) OR (challenger_id = $2 AND challenged_id = $1)
    ) AND state IN ('pending','accepted') LIMIT 1`;
    const { rows } = await pool.query(q, [userA, userB]);
    return rows.length > 0;
  }

  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM challenges WHERE id = $1', [id]);
  }
}

export default ChallengeRepositoryPg;
