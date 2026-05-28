import { Routes } from '@angular/router';
import { authGuard } from '@core/guards/auth.guard';
import { ShellComponent } from '@layout/pages/shell.component';

export const routes: Routes = [
  // Rutas públicas
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  // Rutas protegidas (dentro del Shell)
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES),
      },
      {
        path: 'profile',
        loadChildren: () =>
          import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
      },
      {
        path: 'vehicles',
        loadChildren: () =>
          import('./features/vehicles/vehicles.routes').then((m) => m.VEHICLES_ROUTES),
      },
      {
        path: 'matchmaking',
        loadChildren: () =>
          import('./features/matchmaking/matchmaking.routes').then((m) => m.MATCHMAKING_ROUTES),
      },
      {
        path: 'challenges',
        loadChildren: () =>
          import('./features/challenges/challenges.routes').then((m) => m.CHALLENGES_ROUTES),
      },
      {
        path: 'notifications',
        loadChildren: () =>
          import('./features/notifications/notifications.routes').then((m) => m.NOTIFICATIONS_ROUTES),
      },
      {
        path: 'admin',
        loadChildren: () =>
          import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  // Wildcard
  { path: '**', redirectTo: '/auth/login' },
];
