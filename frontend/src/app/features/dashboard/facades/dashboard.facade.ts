/**
 * @fileoverview Facade del Dashboard.
 * Coordina la carga de datos y el estado de la pantalla principal.
 *
 * @class DashboardFacade
 */
import { Injectable, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { DashboardService } from '../services/dashboard.service';
import { AuthService } from '@core/services/auth.service';
import { User } from '@shared/interfaces';
import { Challenge } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly dashboardService = inject(DashboardService);
  readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly topPilots = signal<User[]>([]);
  readonly recentChallenges = signal<Challenge[]>([]);
  readonly currentUser = this.authService.currentUser;

  /**
   * Carga todos los datos del dashboard en paralelo.
   */
  loadDashboard(): void {
    this.isLoading.set(true);

    forkJoin({
      pilots: this.dashboardService.getTopPilots(10),
      challenges: this.dashboardService.getRecentChallenges(5),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ pilots, challenges }) => {
          this.topPilots.set(pilots.data);
          this.recentChallenges.set(challenges.data);
        },
        error: (err) => console.error('[Dashboard] Error cargando datos:', err),
      });
  }
}
