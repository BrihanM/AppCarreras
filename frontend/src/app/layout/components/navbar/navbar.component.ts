/**
 * @fileoverview Componente Navbar de la aplicación.
 * Barra de navegación superior con info del usuario autenticado, notificaciones y logout.
 *
 * @description
 * Smart Component: accede al AuthService para datos del usuario actual.
 * Muestra badge de notificaciones no leídas.
 */
import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { APP_ROUTES } from '@core/constants/app.constants';

@Component({
  selector: 'srx-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  readonly authService = inject(AuthService);
  readonly routes = APP_ROUTES;

  /** Getter para exponer el usuario actual de forma tipada a la plantilla. */
  get currentUser() {
    return this.authService.currentUser();
  }

  /** Cantidad de notificaciones no leídas a mostrar en el badge. */
  @Input() unreadCount = 0;

  /** Emite cuando el usuario presiona el botón del menú lateral (mobile). */
  @Output() menuToggle = new EventEmitter<void>();

  /**
   * Cierra sesión del usuario actual.
   */
  logout(): void {
    this.authService.logout();
  }
}
