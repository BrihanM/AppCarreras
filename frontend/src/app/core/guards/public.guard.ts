/**
 * @fileoverview Guard funcional para rutas públicas (login/register).
 * Redirige al dashboard si el usuario ya tiene sesión activa.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/app.constants';

/**
 * Guard funcional que previene acceso a rutas de auth si ya hay sesión.
 *
 * @returns true si NO hay sesión, UrlTree de redirección al dashboard en caso contrario.
 */
export const publicGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([APP_ROUTES.DASHBOARD]);
};
