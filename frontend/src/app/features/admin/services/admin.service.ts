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
import { ApiResponse, PaginatedResponse, User, Category, CategoryPayload } from '@shared/interfaces';


export interface CacheRule {
  id: string;
  name?: string;
  mutating_endpoint: string;
  invalidates: string[];
}

export interface AdminVehicle {
  id: string;
  user_id: string;
  user_name?: string;
  make: string;
  model: string;
  brand_catalog_id?: string;
  model_catalog_id?: string;
  plate: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface VehicleCatalogItem {
  id: string;
  name: string;
  type: 'brand' | 'model';
  parent_id?: string | null;
  parent_name?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AdminChallenge {
  id: string;
  challengerId: string;
  challengedId: string;
  challengerName?: string;
  challengedName?: string;
  challengerPlate?: string;
  challengedPlate?: string;
  status: string;
  winnerId?: string;
  agreedLocation?: string;
  agreedDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
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
    return this.http.get<PaginatedResponse<Category>>(`${this.base}/categories`, { withCredentials: true });
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
    return this.http.post<ApiResponse<Category>>(`${this.base}/categories`, payload, { withCredentials: true });
  }

  /**
   * Elimina una categoría.
   * @param id ID de la categoría.
   */
  deleteCategory(id: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/categories/${id}`, { withCredentials: true });
  }

  updateCategory(id: string, payload: Partial<CategoryPayload>): Observable<ApiResponse<Category>> {
    return this.http.put<ApiResponse<Category>>(`${this.base}/categories/${id}`, payload, { withCredentials: true });
  }

  /** Lista vehículos con filtros admin. */
  getAdminVehicles(filters?: { page?: number; limit?: number; user_id?: string; search?: string }): Observable<ApiResponse<AdminVehicle[]>> {
    let params = new HttpParams();
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.user_id) params = params.set('user_id', filters.user_id);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<ApiResponse<AdminVehicle[]>>(`${this.base}/admin/vehicles`, { params });
  }

  /** Actualiza vehículo desde panel admin. */
  updateAdminVehicle(id: string, payload: Partial<AdminVehicle>): Observable<ApiResponse<AdminVehicle>> {
    return this.http.put<ApiResponse<AdminVehicle>>(`${this.base}/admin/vehicles/${id}`, payload);
  }

  /** Elimina vehículo desde panel admin. */
  deleteAdminVehicle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/vehicles/${id}`);
  }

  /** Lista marcas activas para formularios de vehículos. */
  getVehicleBrands(activeOnly = true): Observable<ApiResponse<VehicleCatalogItem[]>> {
    return this.http.get<ApiResponse<VehicleCatalogItem[]>>(`${this.base}/vehicle-catalog/brands`, {
      params: { activeOnly: String(activeOnly) },
    });
  }

  /** Lista modelos por marca para formularios de vehículos. */
  getVehicleModels(brandId: string, activeOnly = true): Observable<ApiResponse<VehicleCatalogItem[]>> {
    return this.http.get<ApiResponse<VehicleCatalogItem[]>>(`${this.base}/vehicle-catalog/models`, {
      params: { brand_id: brandId, activeOnly: String(activeOnly) },
    });
  }

  /** Lista catálogo completo de marcas/modelos (admin). */
  getVehicleCatalog(params?: { type?: 'brand' | 'model'; parent_id?: string; search?: string }): Observable<ApiResponse<VehicleCatalogItem[]>> {
    let httpParams = new HttpParams();
    if (params?.type) httpParams = httpParams.set('type', params.type);
    if (params?.parent_id) httpParams = httpParams.set('parent_id', params.parent_id);
    if (params?.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<ApiResponse<VehicleCatalogItem[]>>(`${this.base}/admin/vehicle-catalog`, { params: httpParams });
  }

  /** Crea marca o modelo en catálogo (admin). */
  createVehicleCatalog(payload: Partial<VehicleCatalogItem>): Observable<ApiResponse<VehicleCatalogItem>> {
    return this.http.post<ApiResponse<VehicleCatalogItem>>(`${this.base}/admin/vehicle-catalog`, payload);
  }

  /** Actualiza marca o modelo en catálogo (admin). */
  updateVehicleCatalog(id: string, payload: Partial<VehicleCatalogItem>): Observable<ApiResponse<VehicleCatalogItem>> {
    return this.http.put<ApiResponse<VehicleCatalogItem>>(`${this.base}/admin/vehicle-catalog/${id}`, payload);
  }

  /** Lista retos con filtros admin. */
  getAdminChallenges(filters?: { page?: number; limit?: number; status?: string; user_id?: string; search?: string }): Observable<ApiResponse<AdminChallenge[]>> {
    let params = new HttpParams();
    if (filters?.page) params = params.set('page', filters.page);
    if (filters?.limit) params = params.set('limit', filters.limit);
    if (filters?.status) params = params.set('status', filters.status);
    if (filters?.user_id) params = params.set('user_id', filters.user_id);
    if (filters?.search) params = params.set('search', filters.search);
    return this.http.get<ApiResponse<AdminChallenge[]>>(`${this.base}/admin/challenges`, { params });
  }

  /** Actualiza reto desde panel admin. */
  updateAdminChallenge(id: string, payload: Partial<AdminChallenge>): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.base}/admin/challenges/${id}`, payload);
  }

  /** Elimina reto desde panel admin. */
  deleteAdminChallenge(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/admin/challenges/${id}`);
  }
}
