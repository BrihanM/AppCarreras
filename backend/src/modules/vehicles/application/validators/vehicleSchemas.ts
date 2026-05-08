import { z } from 'zod';

export const createVehicleSchema = z.object({
  make: z.string().min(1).max(100),
  model: z.string().min(1).max(100),
  plate: z.string().min(1).max(50),
  active: z.boolean().optional(),
});

export const activateVehicleSchema = z.object({
  // no body expected, kept for future extensibility
});

export type CreateVehicleDTO = z.infer<typeof createVehicleSchema>;
