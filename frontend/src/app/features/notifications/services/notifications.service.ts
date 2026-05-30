/**
 * @fileoverview Servicio HTTP de Notificaciones.
 * Listado y marcado de notificaciones del usuario.
 *
 * @class NotificationsService
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse } from '@shared/interfaces';
import { Notification } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly base = `${environment.apiUrl}/notifications`;

  constructor(private readonly http: HttpClient) {}

  private normalize(raw: any): Notification {
    return {
      id: raw?.id,
      userId: raw?.userId ?? raw?.user_id ?? '',
      type: raw?.type,
      title: raw?.title ?? 'Notificación',
      message: raw?.message ?? '',
      isRead: typeof raw?.isRead === 'boolean' ? raw.isRead : !!raw?.is_read,
      metadata: raw?.metadata,
      createdAt: raw?.createdAt ?? raw?.created_at ?? new Date().toISOString(),
    } as Notification;
  }

  /** Lista todas las notificaciones del usuario autenticado. */
  getNotifications(userId?: string): Observable<PaginatedResponse<Notification>> {
    const url = userId ? `${this.base}?user_id=${encodeURIComponent(userId)}` : this.base;
    return this.http.get<any>(url).pipe(
      map((res) => ({
        ...res,
        data: (res?.data ?? []).map((n: any) => this.normalize(n)),
      }))
    );
  }

  /**
   * Marca una notificación como leída.
   * @param id ID de la notificación.
   */
  markAsRead(id: string): Observable<ApiResponse<Notification>> {
    return this.http.patch<any>(`${this.base}/${id}/read`, {}).pipe(
      map((res) => ({
        success: true,
        message: 'Notification marked as read',
        data: this.normalize(res),
      }))
    );
  }

  /** Marca todas las notificaciones como leídas. */
  markAllAsRead(): Observable<ApiResponse<void>> {
    return this.http.patch<ApiResponse<void>>(`${this.base}/read-all`, {});
  }
}
