import { pool } from '../../db';

/**
 * RefreshTokenRow
 * Tipado minimalista de la fila `refresh_tokens`.
 */
type RefreshTokenRow = {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: string;
  created_at: string;
  replaced_by: string | null;
  revoked_at: string | null;
};

/**
 * RefreshTokenRepositoryPg
 * Repositorio para persistir y gestionar `refresh_tokens` en PostgreSQL.
 * - Guarda solo el hash del token.
 * - Permite crear, buscar por hash, marcar como reemplazado y revocar tokens.
 */
export default class RefreshTokenRepositoryPg {
  /**
   * create
   * Inserta un refresh token (hash) en la tabla.
   */
  async create(data: { id?: string; userId: string; tokenHash: string; expiresAt: Date; ip?: string; userAgent?: string }) {
    const id = data.id || null;
    const q = `INSERT INTO refresh_tokens(id, user_id, token_hash, expires_at, ip, user_agent) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`;
    const values = [id, data.userId, data.tokenHash, data.expiresAt.toISOString(), data.ip || null, data.userAgent || null];
    const { rows } = await pool.query(q, values as any);
    return rows[0] as RefreshTokenRow;
  }

  /**
   * findByTokenHash
   * Recupera la fila que contiene `token_hash`.
   */
  async findByTokenHash(hash: string) {
    const q = `SELECT * FROM refresh_tokens WHERE token_hash = $1 LIMIT 1`;
    const { rows } = await pool.query(q, [hash]);
    return rows[0] as RefreshTokenRow | undefined;
  }

  /**
   * markReplaced
   * Marca un token como reemplazado por `replacedById`.
   */
  async markReplaced(id: string, replacedById: string) {
    const q = `UPDATE refresh_tokens SET replaced_by = $1 WHERE id = $2 RETURNING *`;
    const { rows } = await pool.query(q, [replacedById, id]);
    return rows[0] as RefreshTokenRow;
  }

  /**
   * revoke
   * Marca el token como revocado y almacena una razón opcional.
   */
  async revoke(id: string, reason?: string) {
    const q = `UPDATE refresh_tokens SET revoked_at = now(), revoked_reason = $1 WHERE id = $2 RETURNING *`;
    const { rows } = await pool.query(q, [reason || null, id]);
    return rows[0] as RefreshTokenRow;
  }

  /**
   * revokeAllForUser
   * Revoca todos los refresh tokens activos para un usuario.
   */
  async revokeAllForUser(userId: string) {
    const q = `UPDATE refresh_tokens SET revoked_at = now() WHERE user_id = $1 AND revoked_at IS NULL RETURNING *`;
    const { rows } = await pool.query(q, [userId]);
    return rows as RefreshTokenRow[];
  }

  /**
   * findById
   * Recupera un refresh token por su id.
   */
  async findById(id: string) {
    const q = `SELECT * FROM refresh_tokens WHERE id = $1 LIMIT 1`;
    const { rows } = await pool.query(q, [id]);
    return rows[0] as RefreshTokenRow | undefined;
  }
}
