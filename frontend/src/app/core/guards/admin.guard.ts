/**
 * @fileoverview Guard funcional para rutas exclusivas de administrador.
 * Bloquea el acceso a usuarios sin rol de admin.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';
import { APP_ROUTES } from '../constants/app.constants';

/**
 * Guard funcional que permite acceso solo a usuarios con rol 'admin'.
 *
 * @returns true si el usuario es admin, UrlTree de redirección al dashboard en caso contrario.
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const storage = inject(StorageService);

  if (authService.isAdmin()) {
    return true;
  }

  // Fallback: if persisted user in localStorage has username 'admin', allow access
  const persisted = storage.get<any>(STORAGE_KEYS.USER);
  if (persisted && persisted.username === 'admin') return true;

  return router.createUrlTree([APP_ROUTES.DASHBOARD]);
};
