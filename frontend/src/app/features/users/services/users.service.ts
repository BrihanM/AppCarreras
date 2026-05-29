/**
 * Servicio HTTP para creación/gestión de `users` (empleados/pilotos vinculados a una cuenta).
 */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse } from '@shared/interfaces';
import { CreateUserPayload } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly base = `${environment.apiUrl}/users`;

  constructor(private readonly http: HttpClient) {}

  /** Crea un usuario/piloto vinculado a una `account` */
  createUser(payload: CreateUserPayload): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(this.base, payload);
  }
}
