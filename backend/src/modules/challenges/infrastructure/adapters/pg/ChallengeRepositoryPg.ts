import IChallengeRepository from '../../../domain/ports/IChallengeRepository';
import { Challenge } from '../../../domain/entities/Challenge';
import { pool } from '../../db';

/**
 * Repositorio PostgreSQL para `Challenge`.
 */
class ChallengeRepositoryPg implements IChallengeRepository {
  /**
   * create
   * Inserta un nuevo challenge.
   */
  async create(c: Partial<Challenge>): Promise<Challenge> {
    const q = `INSERT INTO challenges (id, challenger_id, challenged_id, competition_category_id, career_type, challenger_vehicle_id, challenged_vehicle_id, state, winner_id, agreed_location, agreed_date, notes)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`;
    const values = [
      c.id,
      c.challenger_id,
      c.challenged_id,
      c.competition_category_id || null,
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

  /**
   * findById
   * Recupera un challenge por id.
   */
  async findById(id: string): Promise<Challenge | null> {
    const { rows } = await pool.query('SELECT * FROM challenges WHERE id = $1', [id]);
    return rows[0] || null;
  }

  /**
   * update
   * Actualiza campos permitidos de un challenge y devuelve la fila actualizada.
   */
  async update(id: string, attrs: Partial<Challenge>): Promise<Challenge> {
    const existing = await this.findById(id);
    if (!existing) throw new Error('Challenge not found');
    const updated = { ...existing, ...attrs } as any;
    const q = `
      UPDATE challenges
      SET state=$1,
          winner_id=$2,
          agreed_location=$3,
          agreed_date=$4,
          notes=$5,
          challenged_id=$6,
          challenged_vehicle_id=$7,
          career_type=$8,
          competition_category_id=$9,
          updated_at=NOW()
      WHERE id=$10
      RETURNING *
    `;
    const values = [
      updated.state,
      updated.winner_id || null,
      updated.agreed_location || null,
      updated.agreed_date || null,
      updated.notes || null,
      updated.challenged_id || null,
      updated.challenged_vehicle_id || null,
      updated.career_type || null,
      updated.competition_category_id || null,
      id,
    ];
    const { rows } = await pool.query(q, values);
    return rows[0];
  }

  /**
   * listByUser
   * Lista challenges asociados a un usuario (como retador o retado).
   */
  async listByUser(userId: string): Promise<Challenge[]> {
    const { rows } = await pool.query('SELECT * FROM challenges WHERE challenger_id = $1 OR challenged_id = $1 ORDER BY created_at DESC', [userId]);
    return rows;
  }

  /**
   * existsActiveBetween
   * Determina si hay un challenge activo (pending/accepted) entre dos usuarios.
   */
  async existsActiveBetween(userA: string, userB: string): Promise<boolean> {
    const q = `SELECT 1 FROM challenges WHERE (
      (challenger_id = $1 AND challenged_id = $2) OR (challenger_id = $2 AND challenged_id = $1)
    ) AND state IN ('pending','accepted') LIMIT 1`;
    const { rows } = await pool.query(q, [userA, userB]);
    return rows.length > 0;
  }

  /**
   * delete
   * Elimina un challenge por id.
   */
  async delete(id: string): Promise<void> {
    await pool.query('DELETE FROM challenges WHERE id = $1', [id]);
  }
}

export default ChallengeRepositoryPg;
