/**
 * @fileoverview Servicio HTTP de Matchmaking.
 * Obtiene pilotos disponibles para retar (por ciudad, rango, etc.).
 *
 * @class MatchmakingService
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { PaginatedResponse, User } from '@shared/interfaces';

/** Filtros de búsqueda de pilotos. */
export interface PilotFilters {
  city?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class MatchmakingService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  /**
   * Obtiene la lista de pilotos disponibles con filtros opcionales.
   * @param filters Filtros de búsqueda.
   */
  getPilots(filters: PilotFilters = {}): Observable<PaginatedResponse<User>> {
    let params = new HttpParams();
    if (filters.city) params = params.set('city', filters.city);
    if (filters.page) params = params.set('page', filters.page);
    if (filters.limit) params = params.set('limit', filters.limit ?? 12);
    return this.http.get<PaginatedResponse<User>>(this.base, { params });
  }
}
