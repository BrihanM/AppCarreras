/**
 * @fileoverview Componente Navbar de la aplicación.
 * Barra de navegación superior con info del usuario autenticado, notificaciones y logout.
 *
 * @description
 * Smart Component: accede al AuthService para datos del usuario actual.
 * Muestra badge de notificaciones no leídas.
 */
import { Component, inject, Input, Output, EventEmitter, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { APP_ROUTES } from '@core/constants/app.constants';
import { signal } from '@angular/core';
import { NotificationsFacade } from '@features/notifications/facades/notifications.facade';
import { NotificationsPopoverComponent } from '@features/notifications/components/notifications-popover.component';

@Component({
  selector: 'srx-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationsPopoverComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent implements OnDestroy {
  readonly authService = inject(AuthService);
  readonly routes = APP_ROUTES;
  private readonly notificationsFacade = inject(NotificationsFacade);

  readonly notificationsOpen = signal(false);
  @ViewChild('notifWrapper', { static: true }) notifWrapper!: ElementRef<HTMLElement>;
  @ViewChild('notifBtn', { static: true }) notifBtn!: ElementRef<HTMLElement>;

  private readonly onDocClick = (ev: MouseEvent) => {
    if (!this.notificationsOpen()) return;
    try {
      const path = (ev.composedPath && ev.composedPath()) || (ev as any).path || [];
      if (!path || !path.length) return;
      if (this.notifWrapper && path.includes(this.notifWrapper.nativeElement)) return;
      if (this.notifBtn && path.includes(this.notifBtn.nativeElement)) return;
      this.notificationsOpen.set(false);
    } catch (e) {
      // fallback: close anyway
      this.notificationsOpen.set(false);
    }
  };

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

  toggleNotifications(): void {
    const open = !this.notificationsOpen();
    this.notificationsOpen.set(open);
    if (open) this.notificationsFacade.loadNotifications();
    // attach/detach global click listener
    if (open) setTimeout(() => window.addEventListener('click', this.onDocClick), 0);
    else window.removeEventListener('click', this.onDocClick);
  }

  ngOnDestroy(): void {
    window.removeEventListener('click', this.onDocClick);
  }
}
