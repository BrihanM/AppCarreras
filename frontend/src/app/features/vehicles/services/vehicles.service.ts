/**
 * @fileoverview Servicio HTTP de Vehículos.
 * CRUD completo de vehículos del piloto autenticado.
 *
 * @class VehiclesService
 */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse } from '@shared/interfaces';
import { Vehicle, VehiclePayload } from '@shared/interfaces';
import { AuthService } from '@core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly api = environment.apiUrl;
  private readonly auth = inject(AuthService);

  constructor(private readonly http: HttpClient) {}

  /** Lista todos los vehículos del usuario autenticado. */
  getMyVehicles(): Observable<PaginatedResponse<Vehicle>> {
    const id = this.auth.currentUser()?.id;
    if (!id) return of({ data: [], total: 0 } as any);
    // First attempt: fetch vehicles by the current user's id (expected to be users.id)
    return this.http.get<any>(`${this.api}/users/${id}/vehicles`).pipe(
      map((res) => (Array.isArray(res) ? { data: res, total: res.length } : res)),
      // If result is empty, try fallback: locate user by account_id and request their vehicles
      switchMap((res: any) => {
        const list = res?.data ?? [];
        if (list.length) return of(res as any);

        const accountId = this.auth.currentUser()?.id;
        // Try to find the linked user row by scanning /users (limited) for matching account_id
        const params = { params: new (window as any).URLSearchParams([['limit', '1000']]) } as any;
        return this.http.get<any>(`${this.api}/users`, { params: { limit: '1000' } }).pipe(
          map((uRes: any) => (uRes?.data ?? uRes) as any[]),
          switchMap((users: any[]) => {
            const found = (users || []).find((u: any) => String(u.account_id) === String(accountId) || String(u.id) === String(accountId));
            if (!found) return of({ data: [], total: 0 } as any);
            return this.http.get<any>(`${this.api}/users/${found.id}/vehicles`).pipe(
              map((r2) => (Array.isArray(r2) ? { data: r2, total: r2.length } : r2)),
              catchError(() => of({ data: [], total: 0 } as any))
            );
          }),
          catchError(() => of({ data: [], total: 0 } as any))
        );
      }),
      catchError(() => of({ data: [], total: 0 } as any))
    );
  }

  /** Lista los vehículos de un usuario por su id. */
  getVehiclesForUser(userId: string): Observable<PaginatedResponse<Vehicle>> {
    if (!userId) return of({ data: [], total: 0 } as any);
    return this.http.get<any>(`${this.api}/users/${userId}/vehicles`).pipe(
      map((res: any) => (Array.isArray(res) ? { data: res, total: res.length } : res)),
      catchError(() => of({ data: [], total: 0 } as any))
    );
  }

  /**
   * Crea un nuevo vehículo.
   * @param payload Datos del vehículo.
   */
  createVehicle(payload: VehiclePayload): Observable<ApiResponse<Vehicle>> {
    const id = this.auth.currentUser()?.id;
    const backendPayload = {
      make: (payload as any).make || payload.brand,
      model: payload.model,
      plate: payload.plate ?? 'N/A',
      active: false,
    } as any;
    return this.http.post<any>(`${this.api}/users/${id}/vehicles`, backendPayload).pipe(
      map((res) => ({ data: res } as ApiResponse<Vehicle>))
    );
  }

  /**
   * Actualiza un vehículo existente.
   * @param id ID del vehículo.
   * @param payload Datos actualizados.
   */
  updateVehicle(id: string, payload: Partial<VehiclePayload>): Observable<ApiResponse<Vehicle>> {
    return this.http.put<ApiResponse<Vehicle>>(`${this.api}/vehicles/${id}`, payload);
  }

  /**
   * Elimina un vehículo.
   * @param id ID del vehículo.
   */
  deleteVehicle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.api}/vehicles/${id}`);
  }

  /**
   * Activa un vehículo como el principal del piloto.
   * @param id ID del vehículo a activar.
   */
  activateVehicle(id: string): Observable<ApiResponse<Vehicle>> {
    return this.http.patch<any>(`${this.api}/vehicles/${id}/activate`, {}).pipe(
      map((res) => ({ data: res } as ApiResponse<Vehicle>))
    );
  }
}
