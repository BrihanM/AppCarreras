import { z } from 'zod';

/**
 * createChallengeSchema
 * Valida la creación de un `Challenge`.
 */
export const createChallengeSchema = z.object({
  challenger_id: z.string().uuid(),
  challenged_id: z.string().uuid(),
  career_type: z.string().optional(),
  challenger_vehicle_id: z.string().uuid(),
  challenged_vehicle_id: z.string().uuid(),
  agreed_location: z.string().optional(),
  agreed_date: z.string().optional(), // ISO date string
  notes: z.string().optional(),
});

/**
 * completeChallengeSchema
 * Valida la finalización de un `Challenge` indicando `winner_id`.
 */
export const completeChallengeSchema = z.object({
  winner_id: z.string().uuid(),
  notes: z.string().optional(),
});
