/**
 * @fileoverview Servicio HTTP de Notificaciones.
 * Listado y marcado de notificaciones del usuario.
 *
 * @class NotificationsService
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse } from '@shared/interfaces';
import { Notification } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly base = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  /** Lista todas las notificaciones del usuario autenticado. */
  getNotifications(userId?: string): Observable<PaginatedResponse<Notification>> {
    const url = userId ? `${this.base}?user_id=${encodeURIComponent(userId)}` : this.base;
    return this.http.get<PaginatedResponse<Notification>>(url);
  }

  /**
   * Marca una notificación como leída.
   * @param id ID de la notificación.
   */
  markAsRead(id: string): Observable<ApiResponse<Notification>> {
    return this.http.patch<ApiResponse<Notification>>(`${this.base}/${id}/read`, {});
  }

  /** Marca todas las notificaciones como leídas. */
  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/read-all`, {});
  }
}
