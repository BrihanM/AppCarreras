/**
 * @fileoverview Servicio HTTP de administración.
 * Gestión de usuarios y categorías para el panel de admin.
 *
 * @class AdminService
 */
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ApiResponse, PaginatedResponse, User } from '@shared/interfaces';
import { Category, CategoryPayload } from '@shared/interfaces';
import { Observable } from 'rxjs';
import { ApiResponse, PaginatedResponse } from '@shared/interfaces';

export interface CacheRule {
  id: string;
  name?: string;
  mutating_endpoint: string;
  invalidates: string[];
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly base = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** Lista todos los usuarios de la plataforma (admin). */
  getAllUsers(page = 1, limit = 20): Observable<PaginatedResponse<User>> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http.get<PaginatedResponse<User>>(`${this.base}/users`, { params });
  }

  /**
   * Suspende la cuenta de un usuario.
   * @param id ID del usuario.
   */
  suspendUser(id: string): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.base}/users/${id}/suspend`, {});
  }

  /**
   * Elimina un usuario del sistema.
   * @param id ID del usuario.
   */
  deleteUser(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/users/${id}`);
  }

  /** Lista todas las categorías. */
  getCategories(): Observable<PaginatedResponse<Category>> {
    return this.http.get<PaginatedResponse<Category>>(`${this.base}/categories`);
  }

  /** Lista reglas de invalidación (admin). */
  getCacheRules(): Observable<ApiResponse<CacheRule[]>> {
    return this.http.get<ApiResponse<CacheRule[]>>(`${this.base}/admin/cache-rules`);
  }

  /** Crea una regla de invalidación. */
  createCacheRule(payload: Partial<CacheRule>): Observable<ApiResponse<CacheRule>> {
    return this.http.post<ApiResponse<CacheRule>>(`${this.base}/admin/cache-rules`, payload);
  }

  /** Actualiza una regla de invalidación. */
  updateCacheRule(id: string, payload: Partial<CacheRule>): Observable<ApiResponse<CacheRule>> {
    return this.http.put<ApiResponse<CacheRule>>(`${this.base}/admin/cache-rules/${id}`, payload);
  }

  /** Elimina una regla de invalidación. */
  deleteCacheRule(id: string): Observable<any> {
    return this.http.delete(`${this.base}/admin/cache-rules/${id}`);
  }

  /**
   * Crea una nueva categoría.
   * @param payload Datos de la categoría.
   */
  createCategory(payload: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(`${this.base}/categories`, payload);
  }

  /**
   * Elimina una categoría.
   * @param id ID de la categoría.
   */
  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`);
  }
}
