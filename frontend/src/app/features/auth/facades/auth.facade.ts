/**
 * @fileoverview Facade del módulo de autenticación.
 * Capa de abstracción entre los componentes de Auth y el AuthService del core.
 *
 * @description
 * - Exposé los states y métodos del AuthService de forma cohesionada.
 * - Los componentes de Auth solo dependen del AuthFacade, nunca de servicios directamente.
 * - Gestiona estados de loading y error locales al feature.
 *
 * @class AuthFacade
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { concatMap, map } from 'rxjs/operators';

import { AuthService } from '@core/services/auth.service';
import { ToastService } from '@core/services/toast.service';
import { APP_ROUTES } from '@core/constants/app.constants';
import { LoginCredentials, RegisterPayload, RegisterWithUserPayload } from '@shared/interfaces';
import { UsersService } from '@features/users/services/users.service';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly usersService = inject(UsersService);

  /** Signal de estado de carga durante operaciones de auth. */
  readonly isLoading = signal(false);

  /** Signal de error del último intento de auth. */
  readonly error = signal<string | null>(null);

  /** Usuario actual expuesto desde el AuthService. */
  readonly currentUser = this.authService.currentUser;

  /** Estado de autenticación. */
  readonly isAuthenticated = this.authService.isAuthenticated;

  /**
   * Ejecuta el flujo de login.
   * @param credentials Credenciales de acceso del usuario.
   */
  login(credentials: LoginCredentials): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.authService
      .login(credentials)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.toastService.success('¡Bienvenido de vuelta, piloto!');
          this.router.navigate([APP_ROUTES.DASHBOARD]);
        },
        error: (err) => {
          const msg = err.friendlyMessage ?? 'Error al iniciar sesión.';
          this.error.set(msg);
          this.toastService.error(msg);
        },
      });
  }

  /**
   * Ejecuta el flujo de registro.
   * @param payload Datos del nuevo usuario.
   */
  register(payload: RegisterWithUserPayload): void {
    this.isLoading.set(true);
    this.error.set(null);

    const accountPayload: RegisterPayload = {
      username: payload.username,
      email: payload.email,
      password: payload.password,
    };

    this.authService
      .register(accountPayload)
      .pipe(
        concatMap((res) => {
          const accountId = res.data.user.id as string;
          const userPayload = { ...payload.user, account_id: accountId };
          return this.usersService.createUser(userPayload).pipe(map(() => res));
        }),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: () => {
          this.toastService.success('¡Cuenta y perfil creados! Bienvenido a StreetRaceX.');
          this.router.navigate([APP_ROUTES.DASHBOARD]);
        },
        error: (err) => {
          const msg = err.friendlyMessage ?? 'Error al crear cuenta o perfil.';
          this.error.set(msg);
          this.toastService.error(msg);
        },
      });
  }

  /** Limpia el estado de error. */
  clearError(): void {
    this.error.set(null);
  }
}
