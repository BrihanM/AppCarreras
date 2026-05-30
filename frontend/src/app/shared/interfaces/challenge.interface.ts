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
  challengedId?: string;
  challengedName: string;
  challengedAvatar?: string;
  status: ChallengeStatus;
  careerType?: string;
  challengerVehicleId?: string;
  challengedVehicleId?: string;
  challengerPlate?: string;
  challengedPlate?: string;
  isOpen?: boolean;
  location?: string;
  scheduledAt?: string;
  completedAt?: string;
  agreedLocation?: string;
  agreedDate?: string;
  notes?: string;
  winnerId?: string;
  createdAt: string;
}

/** Payload para crear un reto. */
export interface CreateChallengePayload {
  challenger_id?: string;
  challenged_id?: string;
  career_type?: string;
  challenger_vehicle_id: string;
  challenged_vehicle_id?: string;
  agreed_location?: string;
  agreed_date?: string;
  notes?: string;
}

/** Resultado al completar un reto. */
export interface CompleteChallengePayload {
  winnerId: string;
}
