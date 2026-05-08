import { z } from 'zod';

/**
 * createAccountSchema
 * Esquema Zod para crear una `Account`.
 * - `username`: requerido, 3-50 caracteres.
 * - `email`: formato válido.
 * - `password`: mínimo 8 caracteres.
 * - `photo`: url o cadena opcional.
 */
export const createAccountSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  photo: z.string().optional(),
});

/**
 * loginSchema
 * Esquema Zod para autenticar (username o email).
 * - `identifier`: username o email.
 * - `password`: contraseña en texto plano.
 */
export const loginSchema = z.object({
  identifier: z.string().min(1), // username or email
  password: z.string().min(1),
});

export type CreateAccountDTO = z.infer<typeof createAccountSchema>;
export type LoginDTO = z.infer<typeof loginSchema>;
