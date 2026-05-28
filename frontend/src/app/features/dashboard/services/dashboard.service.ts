/**
 * @fileoverview Servicio HTTP del Dashboard.
 * Obtiene estadísticas globales, top pilotos y actividad reciente.
 *
 * @class DashboardService
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse, User } from '@shared/interfaces';
import { Challenge } from '@shared/interfaces';

/** Estadísticas del dashboard. */
export interface DashboardStats {
  totalPilots: number;
  totalChallenges: number;
  activeChallenges: number;
  topPilot: User | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene el ranking global de pilotos.
   * @param limit Cantidad de pilotos a traer.
   */
  getTopPilots(limit = 10): Observable<PaginatedResponse<User>> {
    const params = new HttpParams().set('limit', limit).set('page', 1);
    return this.http.get<PaginatedResponse<User>>(`${this.base}/users`, { params });
  }

  /**
   * Obtiene los retos recientes del sistema.
   * @param limit Cantidad de retos.
   */
  getRecentChallenges(limit = 5): Observable<PaginatedResponse<Challenge>> {
    const params = new HttpParams().set('limit', limit).set('page', 1);
    return this.http.get<PaginatedResponse<Challenge>>(`${this.base}/challenges`, { params });
  }
}
