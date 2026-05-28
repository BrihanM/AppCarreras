import { Routes } from '@angular/router';

export const MATCHMAKING_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./pages/matchmaking.page').then((m) => m.MatchmakingPage) },
];
