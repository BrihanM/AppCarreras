import { z } from 'zod';

/**
 * createVehicleSchema
 * Valida la creación de un `Vehicle`.
 */
export const createVehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  brand_catalog_id: z.string().uuid().optional(),
  model_catalog_id: z.string().uuid().optional(),
  plate: z.string().min(1).max(50),
  active: z.boolean().optional(),
});

/**
 * updateVehicleSchema
 * Valida la edición parcial de un vehículo en panel admin.
 */
export const updateVehicleSchema = z.object({
  user_id: z.string().uuid().optional(),
  make: z.string().min(1).max(100).optional(),
  model: z.string().min(1).max(100).optional(),
  brand_catalog_id: z.string().uuid().nullable().optional(),
  model_catalog_id: z.string().uuid().nullable().optional(),
  plate: z.string().min(1).max(50).optional(),
  active: z.boolean().optional(),
});

/**
 * activateVehicleSchema
 * Esquema vacío para la operación de activar vehículo (extensible).
 */
export const activateVehicleSchema = z.object({
  // 
});

export type CreateVehicleDTO = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleDTO = z.infer<typeof updateVehicleSchema>;
