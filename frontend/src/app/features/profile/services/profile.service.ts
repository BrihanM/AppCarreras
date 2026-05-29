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
    // El backend expone el perfil en /users/me
    return this.http.get<ApiResponse<User>>(`${this.base}/users/me`);
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   * @param payload Campos a actualizar.
   */
  updateProfile(payload: UpdateProfilePayload): Observable<ApiResponse<User>> {
    // Usar endpoint de actualización de cuenta propia. Si el backend expone /users/me lo rechazará si no soporta PUT,
    // pero por ahora apuntamos a /users/me para mantener consistencia con getMyProfile.
    return this.http.put<ApiResponse<User>>(`${this.base}/users/me`, payload);
  }

  /** Actualiza la cuenta (username/email/password/avatar) del usuario autenticado */
  updateAccount(payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/auth/me`, payload);
  }
}
