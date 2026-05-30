/**
 * @fileoverview Facade del Matchmaking.
 * Gestiona el estado de pilotos disponibles y el flujo de creación de retos.
 *
 * @class MatchmakingFacade
 */
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { MatchmakingService, PilotFilters } from '../services/matchmaking.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { User } from '@shared/interfaces';
import { ProfileFacade } from '@features/profile/facades/profile.facade';

@Injectable({ providedIn: 'root' })
export class MatchmakingFacade {
  private readonly matchmakingService = inject(MatchmakingService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  private readonly profileFacade = inject(ProfileFacade);

  readonly isLoading = signal(false);
  readonly pilots = signal<User[]>([]);
  readonly selectedPilot = signal<User | null>(null);
  readonly cityFilter = signal('');

  /** Carga pilotos disponibles. */
  loadPilots(filters: PilotFilters = {}): void {
    this.isLoading.set(true);
    const rank = String(this.authService.currentUser()?.rank ?? undefined) as string | undefined;
    const params: PilotFilters = { limit: 12, rank, ...(filters || {}) } as PilotFilters;
    this.matchmakingService.getPilots(params)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          // Mapear cada fila del backend al shape `User` usado por la UI
          const currentId = this.authService.currentUser()?.id;
          const mapped = (res.data || []).map((raw: any) => this.profileFacade.mapProfileToUser(raw));
          this.pilots.set(mapped.filter((p) => String(p.id) !== String(currentId)));
        },
        error: () => this.toastService.error('Error cargando pilotos.'),
      });
  }

  /** Marca (optimistic) a un piloto como en reto para bloquear UI. */
  markPilotInChallenge(pilotId: string, inChallenge: boolean): void {
    this.pilots.update((list) =>
      list.map((p) => (String(p.id) === String(pilotId) ? { ...p, inChallenge } : p))
    );
  }

  /**
   * Selecciona un piloto para retarlo.
   * @param pilot Piloto seleccionado.
   */
  selectPilot(pilot: User): void {
    this.selectedPilot.set(pilot);
  }

  clearSelection(): void {
    this.selectedPilot.set(null);
  }

  applyFilter(city: string): void {
    this.cityFilter.set(city);
    this.loadPilots({ city: city || undefined });
  }
}
