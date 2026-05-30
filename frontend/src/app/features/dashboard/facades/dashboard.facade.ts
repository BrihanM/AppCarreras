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
import { RealtimeService } from '@core/services/realtime.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly dashboardService = inject(DashboardService);
  readonly authService = inject(AuthService);
  private readonly profileService = inject(ProfileService);
  private readonly profileFacade = inject(ProfileFacade);
  private readonly realtime = inject(RealtimeService);
  private realtimeSub?: Subscription;

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

          // Normalizar pilotos al shape `User` usado por la UI
          const mappedPilots = (pilots.data || []).map((p: any) => this.profileFacade.mapProfileToUser(p));
          this.topPilots.set(mappedPilots);

          // Challenges may already be in expected format; set directly
          this.recentChallenges.set(challenges.data || []);
        },
        error: (err) => console.error('[Dashboard] Error cargando datos:', err),
      });
  }

  constructor() {
    try {
      this.realtimeSub = this.realtime.events$.subscribe((ev) => {
        if (['user:updated','user:created','challenge:created','challenge:updated','vehicle:activated','category:updated'].includes(ev.type)) {
          this.loadDashboard();
        }
      });
    } catch (e) {}
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }
}
