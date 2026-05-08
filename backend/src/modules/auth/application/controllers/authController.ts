import { Request, Response } from 'express';
import AuthService from '../../domain/services/AuthService';
import AccountRepositoryPg from '../../infrastructure/adapters/pg/AccountRepositoryPg';
import { loginSchema } from '../validators/accountSchemas';
import jwt from 'jsonwebtoken';

const accountRepo = new AccountRepositoryPg();
const service = new AuthService(accountRepo, null);

const login = async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const account = await service.authenticate(parsed.identifier, parsed.password);
    const secret = process.env.JWT_SECRET || 'changeme';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
    const token = jwt.sign({ sub: account.id, username: account.username }, secret as any, { expiresIn } as any);
    const maxAge = 7 * 24 * 60 * 60 * 1000; // default 7 days
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
    });
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default { login };
