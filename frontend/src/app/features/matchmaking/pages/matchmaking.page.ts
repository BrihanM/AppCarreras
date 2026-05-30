/**
 * @fileoverview Página de Matchmaking.
 * Grid dinámico de pilotos disponibles con cards tipo social app.
 */
import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
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
  private readonly cdr = inject(ChangeDetectorRef);
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

    // More permissive UUID check for debugging (accept any version/variant).
    const isUuid = (v?: any) => {
      const ok = typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
      if (!ok) {
        // eslint-disable-next-line no-console
        console.warn('[matchmaking] isUuid failed for value:', v);
      }
      return ok;
    };

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

        // client-side validation: ensure all UUIDs look valid before sending
        const checks = {
          challenger_id: payload.challenger_id,
          challenged_id: payload.challenged_id,
          challenger_vehicle_id: payload.challenger_vehicle_id,
          challenged_vehicle_id: payload.challenged_vehicle_id,
        } as Record<string, any>;
        const invalid = Object.entries(checks).filter(([, v]) => !isUuid(v));
        if (invalid.length) {
          // eslint-disable-next-line no-console
          console.error('[matchmaking] invalid uuid fields:', invalid, 'fullPayload:', payload);
          this.toastService.error('Payload inválido: UUIDs no válidos. Revisa consola para detalles.');
          return;
        }

        // Optimistic UI: mark pilot as challenged to block further actions
        this.facade.markPilotInChallenge(String(pilot.id), true);
        // also keep local sets for existing UI logic
        setTimeout(() => {
          this.challengedIds.add(String(pilot.id));
          try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
        }, 0);

        // DEBUG: log vehicles and payload to troubleshoot invalid UUID errors
        // Remove these logs after verification
        // eslint-disable-next-line no-console
        console.log('[matchmaking] vehicles.me:', me, 'vehicles.other:', other, 'payload:', payload);

        this.challengesService.createChallenge(payload).subscribe({
          next: () => {
            setTimeout(() => {
              this.activeOpponentIds.add(String(pilot.id));
              try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
              this.toastService.success(`¡Reto enviado a ${pilot.username}!`);
            }, 0);
          },
          error: (err: any) => {
            setTimeout(() => {
              this.facade.markPilotInChallenge(String(pilot.id), false);
              this.challengedIds.delete(String(pilot.id));
              try { this.cdr.detectChanges(); } catch (e) { /* ignore */ }
              // Log server response for investigation (stringify to reveal array content)
              // eslint-disable-next-line no-console
              console.error('[matchmaking] createChallenge error:', JSON.stringify(err?.error ?? err));

              // If server returned structured Zod issues, show the first message
              const serverErr = err?.error;
              if (Array.isArray(serverErr) && serverErr.length) {
                const first = serverErr[0];
                const path = Array.isArray(first.path) ? first.path.join('.') : first.path;
                const msg = first.message || JSON.stringify(first);
                this.toastService.error(`Error: ${path} ${msg}`);
              } else {
                this.toastService.error('Error al enviar el reto. Revisa consola para detalles.');
              }
            }, 0);
          },
        });
      },
      error: () => this.toastService.error('Error obteniendo vehículos para el reto'),
    });
  }
}
