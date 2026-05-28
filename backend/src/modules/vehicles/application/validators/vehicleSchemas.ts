import { z } from 'zod';

/**
 * createVehicleSchema
 * Valida la creación de un `Vehicle`.
 */
export const createVehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  plate: z.string().min(1).max(50),
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
