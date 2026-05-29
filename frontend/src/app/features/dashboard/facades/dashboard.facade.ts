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
import { ProfileService } from '@features/profile/services/profile.service';
import { ProfileFacade } from '@features/profile/facades/profile.facade';
import { User } from '@shared/interfaces';
import { Challenge } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly dashboardService = inject(DashboardService);
  readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly profileFacade = inject(ProfileFacade);

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
      profile: this.profileService.getMyProfile(),
      pilots: this.dashboardService.getTopPilots(10),
      challenges: this.dashboardService.getRecentChallenges(5),
    })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: ({ profile, pilots, challenges }) => {
          // Actualiza el usuario en AuthService con el perfil más reciente
          try {
            const mapped = this.profileFacade.mapProfileToUser(profile.data as any);
            this.authService.updateCurrentUser(mapped);
          } catch (e) {
            console.warn('[Dashboard] No se pudo actualizar currentUser:', e);
          }

          this.topPilots.set(pilots.data);
          this.recentChallenges.set(challenges.data);
        },
        error: (err) => console.error('[Dashboard] Error cargando datos:', err),
      });
  }
}
