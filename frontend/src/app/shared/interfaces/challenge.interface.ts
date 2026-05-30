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
  competitionCategoryId?: string;
  competitionCategoryName?: string;
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
  route?: ChallengeRoute;
  winnerId?: string;
  createdAt: string;
}

export interface ChallengeRoute {
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  route_geometry?: unknown;
  provider?: string;
}

/** Payload para crear un reto. */
export interface CreateChallengePayload {
  challenger_id?: string;
  challenged_id?: string;
  competition_category_id?: string;
  career_type?: string;
  challenger_vehicle_id: string;
  challenged_vehicle_id?: string;
  agreed_location?: string;
  agreed_date?: string;
  notes?: string;
  route?: ChallengeRoute;
}

/** Resultado al completar un reto. */
export interface CompleteChallengePayload {
  winnerId: string;
}
