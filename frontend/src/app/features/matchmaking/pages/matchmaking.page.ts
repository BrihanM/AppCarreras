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

  cityFilter = '';
  challengedIds = new Set<string>();
  activeOpponentIds = new Set<string>();

  ngOnInit(): void {
    this.facade.loadPilots();
    // Load my active challenges to disable challenge button for existing active opponents
    this.challengesService.getMyChallenges().subscribe({
      next: (res) => {
        const currentId = this.facade.authService.currentUser()?.id;
        (res.data || []).forEach((c: any) => {
          if (c.state === 'pending' || c.state === 'accepted') {
            const other = c.challengerId === currentId ? c.challengedId : c.challengerId;
            if (other) this.activeOpponentIds.add(other);
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
    if (pilot.id === current.id) { this.toastService.error('No puedes retarte a ti mismo'); return; }
    if ((pilot.rank || '') !== String(current.rank || '')) { this.toastService.error('Solo puedes retar a pilotos de tu mismo rank'); return; }
    if (this.activeOpponentIds.has(pilot.id) || this.challengedIds.has(pilot.id)) { this.toastService.error('Ya existe un reto activo con este piloto'); return; }

    this.challengedIds.add(pilot.id);
    this.challengesService.createChallenge({ challengedId: pilot.id }).subscribe({
      next: () => {
        this.toastService.success(`¡Reto enviado a ${pilot.username}!`);
        this.activeOpponentIds.add(pilot.id);
      },
      error: () => {
        this.challengedIds.delete(pilot.id);
        this.toastService.error('Error al enviar el reto.');
      },
    });
  }
}
