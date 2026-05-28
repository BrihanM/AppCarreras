import { Routes } from '@angular/router';

export const VEHICLES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/vehicles.page').then((m) => m.VehiclesPage),
  },
];
