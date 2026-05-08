import { z } from 'zod';

/**
 * createNotificationSchema
 * Valida la creación de una notificación.
 */
export const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string().min(1).max(50),
  message: z.string().min(1),
  reference_id: z.string().uuid().optional(),
});

/**
 * markReadSchema
 * Esquema vacío para marcar como leída (no requiere body).
 */
export const markReadSchema = z.object({});
