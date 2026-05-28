import { Routes } from '@angular/router';
import { adminGuard } from '@core/guards/admin.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/admin-dashboard.page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/users/admin-users.page').then((m) => m.AdminUsersPage),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/admin-categories.page').then((m) => m.AdminCategoriesPage),
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
