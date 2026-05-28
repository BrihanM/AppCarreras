/**
 * @fileoverview Página de gestión de Retos.
 * Timeline de carreras con tabs para retos pendientes, activos e historial.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChallengesFacade } from '../facades/challenges.facade';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state.component';
import { ChallengeStatus } from '@shared/enums/app.enums';

type TabType = 'pending' | 'active' | 'history';

@Component({
  selector: 'srx-challenges-page',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, EmptyStateComponent],
  templateUrl: './challenges.page.html',
  styleUrls: ['./challenges.page.scss'],
})
export class ChallengesPage implements OnInit {
  readonly facade = inject(ChallengesFacade);
  readonly ChallengeStatus = ChallengeStatus;

  activeTab: TabType = 'pending';

  get currentUserId(): string | undefined {
    return this.facade.authService.currentUser()?.id;
  }

  ngOnInit(): void {
    this.facade.loadChallenges();
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  /**
   * Determina si el usuario autenticado es el ganador de un reto.
   * @param winnerId ID del ganador.
   */
  isWinner(winnerId: string | undefined): boolean {
    return winnerId === this.facade.authService.currentUser()?.id;
  }
}
