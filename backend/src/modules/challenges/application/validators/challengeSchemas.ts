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
  challenger_id: relaxedUuid.optional(),
  challenged_id: relaxedUuid.optional(),
  competition_category_id: relaxedUuid.optional(),
  career_type: z.string().optional(),
  challenger_vehicle_id: relaxedUuid,
  challenged_vehicle_id: relaxedUuid.optional(),
  agreed_location: z.string().optional(),
  agreed_date: z.string().optional(), // ISO date string
  notes: z.string().optional(),
  route: z.object({
    origin_lat: z.number().min(-90).max(90),
    origin_lng: z.number().min(-180).max(180),
    destination_lat: z.number().min(-90).max(90),
    destination_lng: z.number().min(-180).max(180),
    route_geometry: z.unknown().optional(),
    provider: z.string().max(50).optional(),
  }).optional(),
});

export const acceptChallengeSchema = z.object({
  challenged_vehicle_id: relaxedUuid.optional(),
});

/**
 * completeChallengeSchema
 * Valida la finalización de un `Challenge` indicando `winner_id`.
 */
export const completeChallengeSchema = z.object({
  winner_id: z.string().uuid(),
  notes: z.string().optional(),
});
