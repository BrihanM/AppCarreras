/**
 * @fileoverview Servicio HTTP de Retos (Challenges).
 * Gestiona CRUD y acciones de estado de retos entre pilotos.
 *
 * @class ChallengesService
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse } from '@shared/interfaces';
import {
  Challenge,
  CreateChallengePayload,
  CompleteChallengePayload,
} from '@shared/interfaces';
import { Category } from '@shared/interfaces/category.interface';

export interface TrackOption {
  id: string;
  locationName: string;
  competitionCategoryId?: string;
  competitionCategoryName?: string;
  route: {
    origin_lat: number;
    origin_lng: number;
    destination_lat: number;
    destination_lng: number;
    route_geometry?: unknown;
    provider?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ChallengesService {
  private readonly base = `${environment.apiUrl}/challenges`;

  constructor(private readonly http: HttpClient) {}

  /** Lista todos los retos del usuario autenticado. */
  getMyChallenges(): Observable<PaginatedResponse<Challenge>> {
    return this.http.get<PaginatedResponse<Challenge>>(this.base);
  }

  /** Lista categorías activas para tipo de carrera. */
  getActiveCompetitionCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(`${environment.apiUrl}/categories?active=true`);
  }

  /** Lista pistas/rutas predefinidas disponibles para crear retos. */
  getTrackOptions(): Observable<ApiResponse<TrackOption[]>> {
    return this.http.get<ApiResponse<TrackOption[]>>(`${this.base}/tracks`);
  }

  /**
   * Crea un nuevo reto contra otro piloto.
   * @param payload Datos del reto.
   */
  createChallenge(payload: CreateChallengePayload): Observable<ApiResponse<Challenge>> {
    return this.http.post<ApiResponse<Challenge>>(this.base, payload);
  }

  /**
   * Acepta un reto recibido.
   * @param id ID del reto.
   */
  acceptChallenge(id: string, payload?: { challenged_vehicle_id?: string }): Observable<ApiResponse<Challenge>> {
    return this.http.patch<ApiResponse<Challenge>>(`${this.base}/${id}/accept`, payload || {});
  }

  /**
   * Rechaza un reto recibido.
   * @param id ID del reto.
   */
  rejectChallenge(id: string): Observable<ApiResponse<Challenge>> {
    return this.http.patch<ApiResponse<Challenge>>(`${this.base}/${id}/reject`, {});
  }

  /**
   * Marca un reto como completado con el ganador.
   * @param id ID del reto.
   * @param payload ID del ganador.
   */
  completeChallenge(id: string, payload: CompleteChallengePayload): Observable<ApiResponse<Challenge>> {
    return this.http.patch<ApiResponse<Challenge>>(`${this.base}/${id}/complete`, payload);
  }
}
