import { Request, Response, NextFunction } from 'express';

/**
 * parseCookies
 * Middleware que parsea la cabecera `Cookie` y añade `req.cookies`.
 * - Decodifica los valores y los expone en `req.cookies` como un objeto.
 * - No lanza errores si no hay cabecera de cookies.
 *
 * @param {Request} req
 * @param {Response} _res
 * @param {NextFunction} next
 */
function parseCookies(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.cookie;
  (req as any).cookies = {};
  if (!header) return next();
  const parts = header.split(';');
  for (const part of parts) {
    const [k, ...v] = part.split('=');
    const key = k && k.trim();
    const val = v.join('=').trim();
    if (key) (req as any).cookies[key] = decodeURIComponent(val);
  }
  return next();
}

export default parseCookies;
