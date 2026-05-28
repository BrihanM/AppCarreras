import { Request, Response } from 'express';
import AuthService from '../../domain/services/AuthService';
import AccountRepositoryPg from '../../infrastructure/adapters/pg/AccountRepositoryPg';
import RefreshTokenRepositoryPg from '../../infrastructure/adapters/pg/RefreshTokenRepositoryPg';
import { loginSchema } from '../validators/accountSchemas';
import jwt from 'jsonwebtoken';

const accountRepo = new AccountRepositoryPg();
const refreshRepo = new RefreshTokenRepositoryPg();
const service = new AuthService(accountRepo, null, refreshRepo);

/**
 * login
 * Controlador para autenticar a un usuario.
 * - Valida la petición con `loginSchema`.
 * - Llama a `AuthService.authenticate` para verificar credenciales.
 * - Firma un JWT, lo devuelve en el cuerpo y lo establece como cookie HttpOnly.
 *
 * @param {Request} req - Petición Express con `identifier` y `password`.
 * @param {Response} res - Respuesta Express.
 */
const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const account = await service.authenticate(parsed.identifier, parsed.password);
      const secret = process.env.JWT_SECRET || 'changeme';
      console.debug('authController: JWT_SECRET length', String(secret).length);
    const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const accessToken = jwt.sign({ sub: account.id, username: account.username }, secret as any, { expiresIn: accessExpiresIn } as any);
    // create refresh token and set cookie
    const ip = req.ip;
    const ua = req.headers['user-agent'] as string | undefined;
    const { token: refreshToken, expiresAt } = await service.createRefreshToken(account.id, ip, ua);
    const days = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
    const maxAge = days * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });
    // Return standardized ApiResponse shape expected by frontend
    res.json({ success: true, message: 'Authenticated', data: { user: account, accessToken, expiresAt } });
    console.log('TOKEN', accessToken);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * refresh
 * Endpoint que rota el refresh token presentado en cookie y devuelve un nuevo access token.
 */
const refresh = async (req: Request, res: Response) => {
  try {
    const cookie = (req as any).cookies || {};
    const presented = cookie.refreshToken as string | undefined;
    if (!presented) return res.status(401).json({ error: 'Refresh token missing' });
    const ip = req.ip;
    const ua = req.headers['user-agent'] as string | undefined;
    const { token: newRefresh, expiresAt, userId } = await service.rotateRefreshToken(presented, ip, ua);
    const secret = process.env.JWT_SECRET || 'changeme';
    const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
    const accessToken = jwt.sign({ sub: userId }, secret as any, { expiresIn: accessExpiresIn } as any);
    const days = Number(process.env.REFRESH_TOKEN_DAYS) || 7;
    const maxAge = days * 24 * 60 * 60 * 1000;
    res.cookie('refreshToken', newRefresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });
    res.json({ accessToken, expiresAt });
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
};

/**
 * logout
 * Revoca el refresh token de la cookie y borra la cookie en el cliente.
 */
const logout = async (req: Request, res: Response) => {
  try {
    const cookie = (req as any).cookies || {};
    const presented = cookie.refreshToken as string | undefined;
    if (presented) await service.revokeRefreshToken(presented);
    res.cookie('refreshToken', '', { maxAge: 0 });
    res.json({ ok: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default { login, refresh, logout };
