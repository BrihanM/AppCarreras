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
    res.json({ token });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
};

export default { login };
