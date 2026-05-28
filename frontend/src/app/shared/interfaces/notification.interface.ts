/**
 * @fileoverview Modelos de dominio para notificaciones del sistema.
 */
import { NotificationType } from '../enums/app.enums';

/** Notificación recibida por un usuario. */
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
