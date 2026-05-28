/**
 * @fileoverview Servicio HTTP de Perfil de usuario.
 * Actualización de cuenta propia y consulta de perfil público.
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, User, UpdateProfilePayload } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Obtiene el perfil del usuario autenticado. */
  getMyProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.base}/auth/me`);
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   * @param payload Campos a actualizar.
   */
  updateProfile(payload: UpdateProfilePayload): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.base}/auth/account`, payload);
  }
}
