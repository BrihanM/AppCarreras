import crypto from 'crypto';

/**
 * hashToken
 * Hashea un token (string) usando SHA-256 y devuelve hex.
 * Usado para almacenar solo la huella del refresh token en la DB.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export default hashToken;
