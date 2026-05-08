import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'changeme';

/**
 * extractTokenFromRequest
 * Extrae un token JWT de la petición buscando en:
 * - Header `Authorization: Bearer <token>`
 * - Cookie `token` (populada por `parseCookies`)
 * - Header personalizado `x-cookie` que contenga la cookie `token=`.
 *
 * Devuelve `null` si no encuentra token.
 */
export function extractTokenFromRequest(req: Request): string | null {
  const auth = req.headers.authorization as string | undefined;
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  const cookies = (req as any).cookies || {};
  // Prefer access token cookie if present (accessToken), fall back to legacy `token` cookie
  if (cookies.accessToken) return cookies.accessToken;
  if (cookies.token) return cookies.token;
  // allow custom header that may carry cookie string (e.g., from some web clients)
  const cookieHeader = req.headers['x-cookie'] as string | undefined;
  if (cookieHeader) {
    const matchAccess = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('accessToken='));
    if (matchAccess) return decodeURIComponent(matchAccess.split('=')[1]);
    const match = cookieHeader.split(';').map(p => p.trim()).find(p => p.startsWith('token='));
    if (match) return decodeURIComponent(match.split('=')[1]);
  }
  return null;
}

/**
 * cookieAuth
 * Middleware factory que verifica JWT extraído por `extractTokenFromRequest`.
 * - Si `optional` es true, la ausencia o invalidación del token no bloquea la petición.
 * - Si `optional` es false, responde 401 cuando falta o es inválido.
 */
export default function cookieAuth(optional = true) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = extractTokenFromRequest(req);
    if (!token) {
      if (optional) return next();
      return res.status(401).json({ error: 'Authentication token missing' });
    }
    try {
      const payload = jwt.verify(token, secret as any) as any;
      (req as any).user = { id: payload.sub, username: payload.username };
      return next();
    } catch (err: any) {
      if (optional) return next();
      return res.status(401).json({ error: 'Invalid token' });
    }
  };
}
