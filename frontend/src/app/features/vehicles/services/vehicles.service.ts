/**
 * @fileoverview Servicio HTTP de Vehículos.
 * CRUD completo de vehículos del piloto autenticado.
 *
 * @class VehiclesService
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse } from '@shared/interfaces';
import { Vehicle, VehiclePayload } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class VehiclesService {
  private readonly base = `${environment.apiUrl}/vehicles`;

  constructor(private readonly http: HttpClient) {}

  /** Lista todos los vehículos del usuario autenticado. */
  getMyVehicles(): Observable<PaginatedResponse<Vehicle>> {
    return this.http.get<PaginatedResponse<Vehicle>>(this.base);
  }

  /**
   * Crea un nuevo vehículo.
   * @param payload Datos del vehículo.
   */
  createVehicle(payload: VehiclePayload): Observable<ApiResponse<Vehicle>> {
    return this.http.post<ApiResponse<Vehicle>>(this.base, payload);
  }

  /**
   * Actualiza un vehículo existente.
   * @param id ID del vehículo.
   * @param payload Datos actualizados.
   */
  updateVehicle(id: string, payload: Partial<VehiclePayload>): Observable<ApiResponse<Vehicle>> {
    return this.http.put<ApiResponse<Vehicle>>(`${this.base}/${id}`, payload);
  }

  /**
   * Elimina un vehículo.
   * @param id ID del vehículo.
   */
  deleteVehicle(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/${id}`);
  }

  /**
   * Activa un vehículo como el principal del piloto.
   * @param id ID del vehículo a activar.
   */
  activateVehicle(id: string): Observable<ApiResponse<Vehicle>> {
    return this.http.patch<ApiResponse<Vehicle>>(`${this.base}/${id}/activate`, {});
  }
}
