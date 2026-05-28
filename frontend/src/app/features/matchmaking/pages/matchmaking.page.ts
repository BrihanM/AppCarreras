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

  ngOnInit(): void {
    this.facade.loadPilots();
  }

  applyFilter(): void {
    this.facade.applyFilter(this.cityFilter);
  }

  /**
   * Reta a un piloto enviando un reto inmediato.
   * @param pilot Piloto a retar.
   */
  challengePilot(pilot: User): void {
    if (this.challengedIds.has(pilot.id)) return;

    this.challengedIds.add(pilot.id);
    this.challengesService.createChallenge({ challengedId: pilot.id }).subscribe({
      next: () => this.toastService.success(`¡Reto enviado a ${pilot.username}!`),
      error: () => {
        this.challengedIds.delete(pilot.id);
        this.toastService.error('Error al enviar el reto.');
      },
    });
  }
}
