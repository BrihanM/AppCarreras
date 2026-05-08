import { z } from 'zod';

/**
 * createUserSchema
 * Esquema Zod para crear un `User`.
 */
export const createUserSchema = z.object({
  name: z.string().min(1).max(150),
  local_zone: z.string().optional(),
  city_area: z.string().optional(),
  state_zone: z.string().optional(),
  country_zone: z.string().optional(),
  rank: z.string().optional(),
  category_id: z.string().nullable().optional(),
  victories: z.number().int().optional(),
  defeats: z.number().int().optional(),
  consecutive_challenges: z.number().int().optional(),
  state: z.string().optional(),
  account_id: z.string().uuid().optional().nullable(),
});

/**
 * updateUserSchema
 * Versión parcial para actualizaciones de `User`.
 */
export const updateUserSchema = createUserSchema.partial();

export type CreateUserDTO = z.infer<typeof createUserSchema>;
