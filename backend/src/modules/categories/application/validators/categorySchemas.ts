import { z } from 'zod';

/**
 * createCategorySchema
 * Valida la creación de una categoría de competición.
 */
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  is_active: z.boolean().optional(),
});

/**
 * updateCategorySchema
 * Versión parcial para actualizaciones de categoría.
 */
export const updateCategorySchema = createCategorySchema.partial();
