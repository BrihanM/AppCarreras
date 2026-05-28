/**
 * @fileoverview Página principal del Dashboard.
 * Vista de bienvenida con stats del piloto, top ranking y retos recientes.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardFacade } from '../facades/dashboard.facade';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { ChallengeStatus } from '@shared/enums/app.enums';
import { APP_ROUTES } from '@core/constants/app.constants';

@Component({
  selector: 'srx-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  readonly facade = inject(DashboardFacade);
  readonly routes = APP_ROUTES;
  readonly ChallengeStatus = ChallengeStatus;

  ngOnInit(): void {
    this.facade.loadDashboard();
  }

  /** Obtiene el ícono según el estado del reto. */
  getChallengeIcon(status: ChallengeStatus): string {
    const map: Record<ChallengeStatus, string> = {
      [ChallengeStatus.Pending]: '⏳',
      [ChallengeStatus.Accepted]: '⚡',
      [ChallengeStatus.Completed]: '🏆',
      [ChallengeStatus.Rejected]: '❌',
      [ChallengeStatus.Cancelled]: '🚫',
    };
    return map[status] ?? '❓';
  }
}
