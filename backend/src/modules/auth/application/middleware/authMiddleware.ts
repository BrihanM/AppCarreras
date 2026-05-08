import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * requireAuth
 * Middleware que exige autenticación mediante header `Authorization: Bearer <token>`.
 * - Verifica el JWT y añade `req.user` con el payload.
 * - Responde 401 en ausencia o token inválido.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET || 'changeme';
    const payload = jwt.verify(token, secret) as any;
    (req as any).user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

export default requireAuth;
