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

@Injectable({ providedIn: 'root' })
export class MatchmakingFacade {
  private readonly matchmakingService = inject(MatchmakingService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly pilots = signal<User[]>([]);
  readonly selectedPilot = signal<User | null>(null);
  readonly cityFilter = signal('');

  /** Carga pilotos disponibles. */
  loadPilots(filters: PilotFilters = {}): void {
    this.isLoading.set(true);
    this.matchmakingService.getPilots({ limit: 12, ...filters })
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          // Filtrar al usuario actual de la lista
          const currentId = this.authService.currentUser()?.id;
          this.pilots.set(res.data.filter((p) => p.id !== currentId));
        },
        error: () => this.toastService.error('Error cargando pilotos.'),
      });
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
