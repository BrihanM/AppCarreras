/**
 * @fileoverview Página de Dashboard Administrativo.
 */
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_ROUTES } from '@core/constants/app.constants';

@Component({
  selector: 'srx-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="admin-dashboard">
      <h1 class="admin-title">⚙️ Panel de Administración</h1>
      <p class="admin-sub">Gestiona la plataforma StreetRaceX</p>
      <div class="admin-cards">
        <a class="admin-card" [routerLink]="routes.ADMIN.USERS">
          <span class="admin-card__icon">👥</span>
          <span class="admin-card__label">Usuarios</span>
        </a>
        <a class="admin-card" [routerLink]="routes.ADMIN.CATEGORIES">
          <span class="admin-card__icon">📂</span>
          <span class="admin-card__label">Categorías</span>
        </a>
      </div>
    </div>
  `,
  styles: [`
    .admin-dashboard { max-width: 900px; margin: 0 auto; }
    .admin-title { font-size: 1.75rem; font-weight: 900; color: #fff; margin: 0 0 0.25rem; }
    .admin-sub { color: var(--color-text-muted, #888); margin: 0 0 2rem; font-size: 0.9rem; }
    .admin-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 1.25rem; }
    .admin-card {
      display: flex; flex-direction: column; align-items: center; gap: 0.875rem;
      padding: 2rem 1.5rem; background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      text-decoration: none; transition: all 0.2s; cursor: pointer;
      &:hover { border-color: rgba(255,50,0,0.3); transform: translateY(-2px); }
    }
    .admin-card__icon { font-size: 2.5rem; }
    .admin-card__label { font-size: 1rem; font-weight: 700; color: #fff; }
  `],
})
export class AdminDashboardPage {
  readonly routes = APP_ROUTES;
}
