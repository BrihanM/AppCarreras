/**
 * @fileoverview Guard funcional de autenticación.
 * Protege rutas que requieren sesión activa.
 *
 * @description
 * - Si el usuario no está autenticado, redirige a /auth/login.
 * - Compatible con el sistema de Guards funcionales de Angular 17+.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/app.constants';

/**
 * Guard funcional que permite el acceso solo a usuarios autenticados.
 *
 * @returns true si hay sesión activa, UrlTree de redirección en caso contrario.
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree([APP_ROUTES.AUTH.LOGIN]);
};
