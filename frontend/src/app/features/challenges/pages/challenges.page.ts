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
import { RouteMapService } from '@core/services/route-map.service';
import { RouteMapPreviewComponent } from '@shared/components/ui/route-map-preview/route-map-preview.component';

type TabType = 'pending' | 'active' | 'history';
type PendingTabType = 'direct' | 'open';

@Component({
  selector: 'srx-challenges-page',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, EmptyStateComponent, RouteMapPreviewComponent],
  templateUrl: './challenges.page.html',
  styleUrls: ['./challenges.page.scss'],
})
export class ChallengesPage implements OnInit {
  readonly facade = inject(ChallengesFacade);
  readonly ChallengeStatus = ChallengeStatus;
  private readonly routeMapService = inject(RouteMapService);

  activeTab: TabType = 'pending';
  pendingTab: PendingTabType = 'direct';

  get currentUserId(): string | undefined {
    return this.facade.authService.currentUser()?.id;
  }

  ngOnInit(): void {
    this.facade.loadChallenges();
  }

  setTab(tab: TabType): void {
    this.activeTab = tab;
  }

  setPendingTab(tab: PendingTabType): void {
    this.pendingTab = tab;
  }

  /**
   * Determina si el usuario autenticado es el ganador de un reto.
   * @param winnerId ID del ganador.
   */
  isWinner(winnerId: string | undefined): boolean {
    return winnerId === this.facade.authService.currentUser()?.id;
  }

  getRouteUrl(challenge: any): string {
    const route = challenge?.route;
    if (!route) return '';
    return this.routeMapService.buildDirectionsUrl(
      Number(route.origin_lat),
      Number(route.origin_lng),
      Number(route.destination_lat),
      Number(route.destination_lng)
    );
  }

  hasValidRouteCoords(challenge: any): boolean {
    const route = challenge?.route;
    if (!route) return false;
    const coords = [
      Number(route.origin_lat),
      Number(route.origin_lng),
      Number(route.destination_lat),
      Number(route.destination_lng),
    ];
    return coords.every((value) => !Number.isNaN(value));
  }
}
