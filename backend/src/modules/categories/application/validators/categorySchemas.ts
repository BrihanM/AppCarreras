import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();
