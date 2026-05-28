/**
 * @fileoverview Rutas del feature de autenticación.
 * Rutas lazy-loaded protegidas por publicGuard.
 */
import { Routes } from '@angular/router';
import { publicGuard } from '@core/guards/public.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
