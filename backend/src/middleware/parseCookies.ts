import { Request, Response, NextFunction } from 'express';

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
