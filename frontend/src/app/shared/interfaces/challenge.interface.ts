/**
 * @fileoverview Modelos de dominio para retos entre pilotos.
 */
import { ChallengeStatus } from '../enums/app.enums';

/** Reto entre dos pilotos. */
export interface Challenge {
  id: string;
  challengerId: string;
  challengerName: string;
  challengerAvatar?: string;
  challengedId: string;
  challengedName: string;
  challengedAvatar?: string;
  status: ChallengeStatus;
  location?: string;
  scheduledAt?: string;
  completedAt?: string;
  winnerId?: string;
  createdAt: string;
}

/** Payload para crear un reto. */
export interface CreateChallengePayload {
  challengedId: string;
  location?: string;
  scheduledAt?: string;
}

/** Resultado al completar un reto. */
export interface CompleteChallengePayload {
  winnerId: string;
}
