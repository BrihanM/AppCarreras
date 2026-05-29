/**
 * @fileoverview Página de Matchmaking.
 * Grid dinámico de pilotos disponibles con cards tipo social app.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// RouterLink removed: not used in this template
import { MatchmakingFacade } from '../facades/matchmaking.facade';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state.component';
import { ChallengesService } from '../../challenges/services/challenges.service';
import { ToastService } from '@core/services/toast.service';
import { User } from '@shared/interfaces';
import { ChallengeStatus } from '@shared/enums/app.enums';
import { VehiclesService } from '@features/vehicles/services/vehicles.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'srx-matchmaking-page',
  standalone: true,
  imports: [CommonModule, FormsModule, SkeletonComponent, EmptyStateComponent],
  templateUrl: './matchmaking.page.html',
  styleUrls: ['./matchmaking.page.scss'],
})
export class MatchmakingPage implements OnInit {
  readonly facade = inject(MatchmakingFacade);
  private readonly challengesService = inject(ChallengesService);
  private readonly toastService = inject(ToastService);
  private readonly vehiclesService = inject(VehiclesService);

  cityFilter = '';
  challengedIds = new Set<string>();
  activeOpponentIds = new Set<string>();

  // Helpers used by the template to avoid calling global constructors in templates
  isSelf(pilot: User): boolean {
    return String(pilot.id) === String(this.facade.authService.currentUser()?.id);
  }

  hasChallenged(pilot: User): boolean {
    return this.challengedIds.has(String(pilot.id));
  }

  hasActiveOpponent(pilot: User): boolean {
    return this.activeOpponentIds.has(String(pilot.id));
  }

  sameRank(pilot: User): boolean {
    return String(pilot.rank) === String(this.facade.authService.currentUser()?.rank);
  }

  // Devuelve true si existe al menos un piloto con el mismo rank que el usuario actual
  hasSameRankPilots(): boolean {
    return (this.facade.pilots() || []).some((p: User) => this.sameRank(p));
  }

  // Lista filtrada de pilotos que comparten el mismo rank (excluye al propio usuario)
  filteredPilots(): User[] {
    return (this.facade.pilots() || []).filter((p: User) => this.sameRank(p));
  }

  ngOnInit(): void {
    this.facade.loadPilots();
    // Load my active challenges to disable challenge button for existing active opponents
    this.challengesService.getMyChallenges().subscribe({
      next: (res) => {
        const currentId = this.facade.authService.currentUser()?.id;
        (res.data || []).forEach((c: any) => {
          if (c.state === 'pending' || c.state === 'accepted') {
            const other = String(c.challengerId) === String(currentId) ? c.challengedId : c.challengerId;
            if (other) this.activeOpponentIds.add(String(other));
          }
        });
      },
      error: () => {},
    });
  }

  applyFilter(): void {
    this.facade.applyFilter(this.cityFilter);
  }

  /**
   * Reta a un piloto enviando un reto inmediato.
   * @param pilot Piloto a retar.
   */
  challengePilot(pilot: User): void {
    const current = this.facade.authService.currentUser();
    if (!current) { this.toastService.error('Usuario no autenticado'); return; }
    if (String(pilot.id) === String(current.id)) { this.toastService.error('No puedes retarte a ti mismo'); return; }
    if ((String(pilot.rank || '') !== String(current.rank || ''))) { this.toastService.error('Solo puedes retar a pilotos de tu mismo rank'); return; }
    if (this.activeOpponentIds.has(String(pilot.id)) || this.challengedIds.has(String(pilot.id))) { this.toastService.error('Ya existe un reto activo con este piloto'); return; }

    // Retrieve active vehicles for challenger and challenged to satisfy backend schema
    const me$ = this.vehiclesService.getMyVehicles();
    const other$ = this.vehiclesService.getVehiclesForUser(String(pilot.id));

    forkJoin({ me: me$, other: other$ }).subscribe({
      next: ({ me, other }) => {
        const myVeh = (me?.data || []).find((v: any) => v.active) || (me?.data || [])[0];
        const theirVeh = (other?.data || []).find((v: any) => v.active) || (other?.data || [])[0];
        if (!myVeh) { this.toastService.error('Activa un vehículo antes de retar'); return; }
        if (!theirVeh) { this.toastService.error('El rival no tiene vehículo activo'); return; }

        const payload: any = {
          challenger_id: String(current.id),
          challenged_id: String(pilot.id),
          challenger_vehicle_id: String(myVeh.id),
          challenged_vehicle_id: String(theirVeh.id),
        };

        // mark as challenged in next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => this.challengedIds.add(String(pilot.id)), 0);

        this.challengesService.createChallenge(payload).subscribe({
          next: () => {
            setTimeout(() => this.activeOpponentIds.add(String(pilot.id)), 0);
            this.toastService.success(`¡Reto enviado a ${pilot.username}!`);
          },
          error: () => {
            setTimeout(() => this.challengedIds.delete(String(pilot.id)), 0);
            this.toastService.error('Error al enviar el reto.');
          },
        });
      },
      error: () => this.toastService.error('Error obteniendo vehículos para el reto'),
    });
  }
}
