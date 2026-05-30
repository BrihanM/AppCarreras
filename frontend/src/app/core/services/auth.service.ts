/**
 * @fileoverview Servicio central de autenticación.
 * Gestiona login, logout, registro, persistencia de sesión y estado del usuario autenticado.
 *
 * @description
 * - Expone el estado del usuario como Signal para reactividad sin boilerplate.
 * - Persiste el token y el perfil en localStorage mediante StorageService.
 * - Coordina con el AuthFacade para exponerse a los componentes.
 *
 * @class AuthService
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

import { environment } from '@environments/environment';
import { StorageService } from './storage.service';
import { CacheService } from './cache.service';
import { STORAGE_KEYS, APP_ROUTES } from '../constants/app.constants';
import {
  User,
  LoginCredentials,
  RegisterPayload,
  AuthResponse,
} from '@shared/interfaces';
import { ApiResponse } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  /** Signal interno con el usuario autenticado. null = no autenticado. */
  private readonly _currentUser = signal<User | null>(
    this.storage.get<User>(STORAGE_KEYS.USER)
  );

  /** Signal público de solo lectura del usuario actual. */
  readonly currentUser = this._currentUser.asReadonly();

  /** Computed signal: true si hay sesión activa. */
  readonly isAuthenticated = computed(() => this._currentUser() !== null);

  /** Computed signal: true si el usuario es admin. */
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');

  // bootstrap: if there is a persisted user but role is missing, refresh profile from server
  private async bootstrap(): Promise<void> {
    const existing = this._currentUser();
    if (existing && typeof existing.role === 'undefined') {
      try {
        const resp: any = await this.http.get(`${environment.apiUrl}/users/me`).toPromise();
        const profile = resp?.data ?? resp;
        const [firstName, ...rest] = (profile?.name ?? '').split(' ');
        const lastName = rest.join(' ') || undefined;
        const mapped = {
          id: profile?.id ?? existing.id,
          username: profile?.username ?? existing.username ?? '',
          email: existing.email ?? '',
          role: (existing?.role ?? (existing?.username === 'admin' ? 'admin' : 'user')) as any,
          status: (existing?.status ?? 'active') as any,
          firstName: firstName || undefined,
          lastName: lastName || undefined,
          city: profile?.city_area ?? existing.city ?? undefined,
          avatarUrl: profile?.avatar_url ?? (existing as any).photo ?? existing.avatarUrl,
          bio: profile?.bio ?? existing.bio,
          rank: String(profile?.rank ?? existing.rank ?? 'D'),
          wins: Number(profile?.victories ?? existing.wins ?? 0),
          losses: Number(profile?.defeats ?? existing.losses ?? 0),
          createdAt: profile?.created_at ?? existing.createdAt ?? new Date().toISOString(),
          updatedAt: profile?.updated_at ?? existing.updatedAt ?? new Date().toISOString(),
        } as any;
        this.storage.set(STORAGE_KEYS.USER, mapped);
        this._currentUser.set(mapped);
      } catch (e) {
        // ignore
      }
    }
  }

  // invoke bootstrap asynchronously
  private _init = void this.bootstrap();

  /**
   * Autentica al usuario con email y contraseña.
   * Persiste el token y el perfil en localStorage.
   *
   * @param credentials Email y contraseña del usuario.
   * @returns Observable con la respuesta de autenticación.
   */
  login(credentials: LoginCredentials): Observable<ApiResponse<AuthResponse>> {
    const body = { identifier: credentials.email, password: credentials.password };
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, body, { withCredentials: true })
      .pipe(
        tap(({ data }) => {
          this.storage.set(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
          // Persist the raw account returned by auth for debugging, but fetch the linked user profile
          this.storage.set(STORAGE_KEYS.USER, data.user);
          // After login, fetch /users/me to obtain the linked `user` (profile) and map it as the active currentUser
          this.http.get<any>(`${environment.apiUrl}/users/me`).subscribe({
            next: (resp) => {
              const profile = resp?.data ?? resp;
              // Map profile similarly to ProfileFacade.mapProfileToUser
              const [firstName, ...rest] = (profile?.name ?? '').split(' ');
              const lastName = rest.join(' ') || undefined;
              const accountRaw: any = data.user as any;
              const mapped = {
                id: profile?.id ?? accountRaw?.id,
                username: profile?.name ?? accountRaw?.username ?? '',
                email: accountRaw?.email ?? '',
                // If DB lacks `role` column, treat seeded 'admin' username as admin fallback
                role: (accountRaw?.role ?? (accountRaw?.username === 'admin' ? 'admin' : 'user')) as any,
                status: (accountRaw?.state ?? 'active') as any,
                firstName: firstName || undefined,
                lastName: lastName || undefined,
                city: profile?.city_area ?? undefined,
                avatarUrl: profile?.avatar_url ?? accountRaw?.photo ?? undefined,
                bio: profile?.bio ?? undefined,
                rank: String(profile?.rank ?? 'D'),
                wins: Number(profile?.victories ?? 0),
                losses: Number(profile?.defeats ?? 0),
                createdAt: profile?.created_at ?? new Date().toISOString(),
                updatedAt: profile?.updated_at ?? new Date().toISOString(),
              } as any;
              this.storage.set(STORAGE_KEYS.USER, mapped);
              this._currentUser.set(mapped);
            },
            error: () => {
              // Fallback to account object if profile isn't available
              this._currentUser.set(data.user);
            },
          });
        })
      );
  }

  /**
   * Registra un nuevo usuario en la plataforma.
   *
   * @param payload Datos de registro del usuario.
   * @returns Observable con la respuesta del servidor.
   */
  register(
    payload: RegisterPayload
  ): Observable<ApiResponse<AuthResponse>> {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${this.apiUrl}/register`, payload)
      .pipe(
        tap(({ data }) => {
          // El endpoint de registro puede no devolver `accessToken` (registro sin login),
          // sólo persistimos la sesión si el servidor nos envía token + user.
          if (data?.accessToken && data?.user) {
            this.storage.set(STORAGE_KEYS.ACCESS_TOKEN, data.accessToken);
            this.storage.set(STORAGE_KEYS.USER, data.user);
            this._currentUser.set(data.user);
          }
        })
      );
  }

  /**
   * Cierra la sesión del usuario actual.
   * Limpia el almacenamiento local y redirige al login.
   */
  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}, { withCredentials: true }).subscribe({
      complete: () => this.clearSession(),
      error: () => this.clearSession(),
    });
  }

  /**
   * Actualiza el signal del usuario (usado tras actualizar el perfil).
   * @param user Usuario actualizado.
   */
  updateCurrentUser(user: User): void {
    this.storage.set(STORAGE_KEYS.USER, user);
    this._currentUser.set(user);
  }

  /** Limpia la sesión local y navega al login. */
  private clearSession(): void {
    this.storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
    this.storage.remove(STORAGE_KEYS.USER);
    this._currentUser.set(null);
    // Clear in-memory cache if available
    try {
      const cache = inject(CacheService);
      cache.clear();
    } catch (e) {
      // ignore if cache service cannot be resolved here
    }
    this.router.navigate([APP_ROUTES.AUTH.LOGIN]);
  }
}
