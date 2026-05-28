import { Routes } from '@angular/router';

export const CHALLENGES_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/challenges.page').then((m) => m.ChallengesPage) },
];
