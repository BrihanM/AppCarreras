/**
 * @fileoverview Guard funcional para rutas exclusivas de administrador.
 * Bloquea el acceso a usuarios sin rol de admin.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { APP_ROUTES } from '../constants/app.constants';

/**
 * Guard funcional que permite acceso solo a usuarios con rol 'admin'.
 *
 * @returns true si el usuario es admin, UrlTree de redirección al dashboard en caso contrario.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAdmin()) {
    return true;
  }

  return router.createUrlTree([APP_ROUTES.DASHBOARD]);
};
