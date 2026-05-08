import { z } from 'zod';

export const createNotificationSchema = z.object({
  user_id: z.string().uuid(),
  type: z.string().min(1).max(50),
  message: z.string().min(1),
  reference_id: z.string().uuid().optional(),
});

export const markReadSchema = z.object({});
