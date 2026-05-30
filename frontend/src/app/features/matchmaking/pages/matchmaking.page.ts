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

  showChallengeModal = false;
  challengeMode: 'open' | 'direct' = 'direct';
  selectedPilot: User | null = null;
  myVehicles: any[] = [];
  directPilotVehicles: any[] = [];

  challengeForm: any = {
    career_type: '',
    challenger_vehicle_id: '',
    challenged_vehicle_id: '',
    agreed_location: '',
    agreed_date: '',
    notes: '',
  };

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

  openOpenChallengeModal(): void {
    this.challengeMode = 'open';
    this.selectedPilot = null;
    this.resetChallengeForm();
    this.loadVehiclesForForm();
    this.showChallengeModal = true;
  }

  openDirectChallengeModal(pilot: User): void {
    const current = this.facade.authService.currentUser();
    if (!current) { this.toastService.error('Usuario no autenticado'); return; }
    if (String(pilot.id) === String(current.id)) { this.toastService.error('No puedes retarte a ti mismo'); return; }
    if ((String(pilot.rank || '') !== String(current.rank || ''))) { this.toastService.error('Solo puedes retar a pilotos de tu mismo rank'); return; }
    if (this.activeOpponentIds.has(String(pilot.id)) || this.challengedIds.has(String(pilot.id))) { this.toastService.error('Ya existe un reto activo con este piloto'); return; }

    this.challengeMode = 'direct';
    this.selectedPilot = pilot;
    this.resetChallengeForm();
    this.loadVehiclesForForm(pilot);
    this.showChallengeModal = true;
  }

  closeChallengeModal(): void {
    this.showChallengeModal = false;
    this.selectedPilot = null;
    this.directPilotVehicles = [];
  }

  private resetChallengeForm(): void {
    this.challengeForm = {
      career_type: '',
      challenger_vehicle_id: '',
      challenged_vehicle_id: '',
      agreed_location: '',
      agreed_date: '',
      notes: '',
    };
  }

  private loadVehiclesForForm(pilot?: User): void {
    const reqs: any = { me: this.vehiclesService.getMyVehicles() };
    if (pilot) reqs.other = this.vehiclesService.getVehiclesForUser(String(pilot.id));

    forkJoin(reqs).subscribe({
      next: ({ me, other }: any) => {
        this.myVehicles = me?.data || [];
        const activeMine = this.myVehicles.find((v: any) => v.active) || this.myVehicles[0];
        this.challengeForm.challenger_vehicle_id = activeMine?.id || '';

        this.directPilotVehicles = other?.data || [];
        const activeOther = this.directPilotVehicles.find((v: any) => v.active) || this.directPilotVehicles[0];
        this.challengeForm.challenged_vehicle_id = activeOther?.id || '';
      },
      error: () => this.toastService.error('No se pudieron cargar los vehículos para el reto.'),
    });
  }

  submitChallengeForm(): void {
    const current = this.facade.authService.currentUser();
    if (!current) { this.toastService.error('Usuario no autenticado'); return; }
    if (!this.challengeForm.challenger_vehicle_id) { this.toastService.error('Selecciona tu vehículo para crear el reto.'); return; }

    if (this.challengeMode === 'direct' && !this.selectedPilot) {
      this.toastService.error('Selecciona un piloto para el reto directo.');
      return;
    }

    const payload: any = {
      challenger_vehicle_id: String(this.challengeForm.challenger_vehicle_id),
      career_type: this.challengeForm.career_type || undefined,
      agreed_location: this.challengeForm.agreed_location || undefined,
      agreed_date: this.challengeForm.agreed_date || undefined,
      notes: this.challengeForm.notes || undefined,
    };

    if (this.challengeMode === 'direct' && this.selectedPilot) {
      payload.challenged_id = String(this.selectedPilot.id);
      if (this.challengeForm.challenged_vehicle_id) {
        payload.challenged_vehicle_id = String(this.challengeForm.challenged_vehicle_id);
      }
    }

    this.challengesService.createChallenge(payload).subscribe({
      next: () => {
        if (this.challengeMode === 'direct' && this.selectedPilot) {
          this.challengedIds.add(String(this.selectedPilot.id));
          this.activeOpponentIds.add(String(this.selectedPilot.id));
        }
        this.toastService.success(this.challengeMode === 'open' ? 'Reto abierto creado.' : 'Reto directo creado.');
        this.closeChallengeModal();
      },
      error: (err: any) => {
        const serverErr = err?.error;
        if (Array.isArray(serverErr) && serverErr.length) {
          const first = serverErr[0];
          const path = Array.isArray(first.path) ? first.path.join('.') : first.path;
          const msg = first.message || JSON.stringify(first);
          this.toastService.error(`Error: ${path} ${msg}`);
          return;
        }
        this.toastService.error('No se pudo crear el reto.');
      },
    });
  }
}
