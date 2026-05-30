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
  templateUrl: './admin-dashboard.page.html',
  styleUrls: ['./admin-dashboard.page.scss'],
})
export class AdminDashboardPage {
  readonly routes = APP_ROUTES;
}
