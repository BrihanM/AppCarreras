/**
 * @fileoverview Facade del módulo de Retos.
 * Gestiona estado reactivo y acciones sobre los retos del piloto.
 *
 * @class ChallengesFacade
 */
import { Injectable, inject, signal, computed } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ChallengesService } from '../services/challenges.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { Challenge } from '@shared/interfaces';
import { ChallengeStatus } from '@shared/enums/app.enums';

@Injectable({ providedIn: 'root' })
export class ChallengesFacade {
  private readonly challengesService = inject(ChallengesService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);

  readonly isLoading = signal(false);
  readonly challenges = signal<Challenge[]>([]);

  /** Retos pendientes de respuesta (recibidos). */
  readonly pendingChallenges = computed(() =>
    this.challenges().filter(
      (c) =>
        c.status === ChallengeStatus.Pending &&
        c.challengedId === this.authService.currentUser()?.id
    )
  );

  /** Retos activos (aceptados). */
  readonly activeChallenges = computed(() =>
    this.challenges().filter((c) => c.status === ChallengeStatus.Accepted)
  );

  /** Historial de retos finalizados. */
  readonly completedChallenges = computed(() =>
    this.challenges().filter(
      (c) =>
        c.status === ChallengeStatus.Completed ||
        c.status === ChallengeStatus.Rejected ||
        c.status === ChallengeStatus.Cancelled
    )
  );

  loadChallenges(): void {
    this.isLoading.set(true);
    this.challengesService.getMyChallenges()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.challenges.set(res.data),
        error: () => this.toastService.error('Error cargando retos.'),
      });
  }

  /**
   * Acepta un reto pendiente.
   * @param id ID del reto.
   */
  acceptChallenge(id: string): void {
    this.challengesService.acceptChallenge(id).subscribe({
      next: (res) => {
        const updated = (res as any)?.data ?? (res as any);
        this.updateChallenge(updated);
        this.toastService.success('¡Reto aceptado! ¡Que gane el mejor!');
      },
      error: () => this.toastService.error('Error al aceptar el reto.'),
    });
  }

  /**
   * Rechaza un reto pendiente.
   * @param id ID del reto.
   */
  rejectChallenge(id: string): void {
    this.challengesService.rejectChallenge(id).subscribe({
      next: (res) => {
        const updated = (res as any)?.data ?? (res as any);
        this.updateChallenge(updated);
        this.toastService.info('Reto rechazado.');
      },
      error: () => this.toastService.error('Error al rechazar el reto.'),
    });
  }

  /**
   * Completa un reto con el ID del ganador.
   * @param id ID del reto.
   * @param winnerId ID del piloto ganador.
   */
  completeChallenge(id: string, winnerId: string): void {
    this.challengesService.completeChallenge(id, { winnerId }).subscribe({
      next: (res) => {
        const updated = (res as any)?.data ?? (res as any);
        this.updateChallenge(updated);
        this.toastService.success('¡Carrera completada! Ranking actualizado.');
      },
      error: () => this.toastService.error('Error al completar el reto.'),
    });
  }

  private updateChallenge(updated: Challenge): void {
    if (!updated || !updated.id) return;
    this.challenges.update((list) =>
      list.map((c) => (c.id === updated.id ? updated : c))
    );
  }
}
