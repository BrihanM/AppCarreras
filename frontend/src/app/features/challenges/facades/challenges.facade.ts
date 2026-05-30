/**
 * @fileoverview Facade del módulo de Retos.
 * Gestiona estado reactivo y acciones sobre los retos del piloto.
 *
 * @class ChallengesFacade
 */
import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { ChallengesService } from '../services/challenges.service';
import { ToastService } from '@core/services/toast.service';
import { AuthService } from '@core/services/auth.service';
import { Challenge } from '@shared/interfaces';
import { ChallengeStatus } from '@shared/enums/app.enums';
import { WebSocketService } from '@core/websocket/websocket.service';
import { SocketEvent } from '@shared/enums/app.enums';
import { MatchmakingFacade } from '@features/matchmaking/facades/matchmaking.facade';
import { VehiclesService } from '@features/vehicles/services/vehicles.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChallengesFacade {
  private readonly challengesService = inject(ChallengesService);
  private readonly toastService = inject(ToastService);
  readonly authService = inject(AuthService);
  private readonly wsService = inject(WebSocketService);
  private readonly matchmaking = inject(MatchmakingFacade);
  private readonly vehiclesService = inject(VehiclesService);
  private wsSub?: Subscription;

  readonly isLoading = signal(false);
  readonly challenges = signal<Challenge[]>([]);

  /** Retos pendientes de respuesta (recibidos). */
  readonly pendingChallenges = computed(() =>
    this.challenges().filter(
      (c) =>
        c.status === ChallengeStatus.Pending &&
        (
          c.challengedId === this.authService.currentUser()?.id ||
          !c.challengedId
        )
    )
  );

  /** Retos pendientes directos (solo entre usuarios involucrados). */
  readonly pendingDirectChallenges = computed(() => {
    const currentUserId = this.authService.currentUser()?.id;
    return this.challenges().filter(
      (c) =>
        c.status === ChallengeStatus.Pending &&
        !c.isOpen &&
        (c.challengerId === currentUserId || c.challengedId === currentUserId)
    );
  });

  /** Retos abiertos pendientes visibles en el feed. */
  readonly pendingOpenChallenges = computed(() =>
    this.challenges().filter((c) => c.status === ChallengeStatus.Pending && !!c.isOpen)
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
        next: (res) => this.challenges.set((res.data || []).map((r: any) => this.normalizeChallenge(r))),
        error: () => this.toastService.error('Error cargando retos.'),
      });
  }

  /** Inicializa listeners en tiempo real para retos. */
  initRealtime(): void {
    // Subscribe to creation/update/completion events and refresh local state
    this.wsSub = this.wsService.on<any>('challenge:created').subscribe((c) => {
      this.loadChallenges();
      this.matchmaking.loadPilots();
    });
    this.wsSub.add(this.wsService.on<any>('challenge:updated').subscribe((c) => {
      this.loadChallenges();
      this.matchmaking.loadPilots();
    }));
    this.wsSub.add(this.wsService.on<any>('challenge:completed').subscribe((c) => {
      this.loadChallenges();
      this.matchmaking.loadPilots();
    }));
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }

  /**
   * Acepta un reto pendiente.
   * @param id ID del reto.
   */
  acceptChallenge(id: string): void {
    this.vehiclesService.getMyVehicles().subscribe({
      next: (vehRes) => {
        const myVehicle = (vehRes?.data || []).find((v: any) => v.active) || (vehRes?.data || [])[0];
        if (!myVehicle?.id) {
          this.toastService.error('Necesitas un vehículo activo para aceptar el reto.');
          return;
        }
        this.challengesService.acceptChallenge(id, { challenged_vehicle_id: String(myVehicle.id) }).subscribe({
          next: (res) => {
            const updated = (res as any)?.data ?? (res as any);
            this.updateChallenge(updated);
            this.toastService.success('¡Reto aceptado! ¡Que gane el mejor!');
          },
          error: () => this.toastService.error('Error al aceptar el reto.'),
        });
      },
      error: () => this.toastService.error('No se pudieron cargar tus vehículos para aceptar el reto.'),
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

  private normalizeChallenge(raw: any): Challenge {
    if (!raw) return raw;
    return {
      id: raw.id,
      challengerId: raw.challengerId || raw.challenger_id,
      challengedId: raw.challengedId || raw.challenged_id,
      challengerName: raw.challengerName || raw.challenger_name || '',
      challengedName: raw.challengedName || raw.challenged_name || '',
      status: (raw.status || raw.state) as any,
      competitionCategoryId: raw.competitionCategoryId || raw.competition_category_id,
      competitionCategoryName: raw.competitionCategoryName || raw.competition_category_name,
      careerType: raw.careerType || raw.career_type,
      challengerVehicleId: raw.challengerVehicleId || raw.challenger_vehicle_id,
      challengedVehicleId: raw.challengedVehicleId || raw.challenged_vehicle_id,
      challengerPlate: raw.challengerPlate || raw.challenger_plate,
      challengedPlate: raw.challengedPlate || raw.challenged_plate,
      isOpen: typeof raw.isOpen === 'boolean' ? raw.isOpen : !(raw.challengedId || raw.challenged_id),
      winnerId: raw.winnerId || raw.winner_id,
      agreedLocation: (raw as any).agreedLocation || raw.agreed_location,
      agreedDate: (raw as any).agreedDate || raw.agreed_date,
      notes: raw.notes,
      route: raw.route,
      createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.updated_at || new Date().toISOString(),
    } as Challenge;
  }

  private updateChallenge(updated: any): void {
    if (!updated || !updated.id) return;
    const norm = this.normalizeChallenge(updated);
    this.challenges.update((list) => list.map((c) => (c.id === norm.id ? norm : c)));
    // Ensure full refresh if the item wasn't present (e.g., pagination)
    if (!this.challenges().some((c) => c.id === norm.id)) {
      this.loadChallenges();
    }
  }
}
