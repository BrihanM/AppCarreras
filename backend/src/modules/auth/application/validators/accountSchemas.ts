import { z } from 'zod';

export const createAccountSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  photo: z.string().optional(),
});

export const loginSchema = z.object({
  identifier: z.string().min(1), // username or email
  password: z.string().min(1),
});

export type CreateAccountDTO = z.infer<typeof createAccountSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
