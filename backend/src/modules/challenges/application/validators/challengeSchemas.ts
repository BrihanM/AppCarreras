import { z } from 'zod';

/**
 * createChallengeSchema
 * Valida la creación de un `Challenge`.
 */
// Note: development seed uses non-RFC variant UUIDs (e.g. fourth segment not starting with 8/9/a/b).
// For development only we accept any 36-char hex UUID with hyphens so tooling and seed data work.
const relaxedUuid = z.string().regex(/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/, {
  message: 'Invalid UUID format',
});

export const createChallengeSchema = z.object({
  challenger_id: relaxedUuid,
  challenged_id: relaxedUuid,
  career_type: z.string().optional(),
  challenger_vehicle_id: relaxedUuid,
  challenged_vehicle_id: relaxedUuid,
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
