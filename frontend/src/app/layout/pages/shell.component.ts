/**
 * @fileoverview Shell del layout principal de la aplicación.
 * Compone Navbar + Sidebar + Router Outlet para todas las rutas protegidas.
 *
 * @description
 * Smart Component: gestiona el estado del sidebar y el contador de notificaciones.
 * Inicializa el WebSocket al montarse si hay sesión activa.
 */
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../components/navbar/navbar.component';
import { SidebarComponent } from '../components/sidebar/sidebar.component';
import { ToastContainerComponent } from '../../shared/components/ui/toast-container/toast-container.component';
import { AuthService } from '@core/services/auth.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { StorageService } from '@core/services/storage.service';
import { STORAGE_KEYS } from '@core/constants/app.constants';
import { NotificationsFacade } from '@features/notifications/facades/notifications.facade';

@Component({
  selector: 'srx-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NavbarComponent,
    SidebarComponent,
    ToastContainerComponent,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly wsService = inject(WebSocketService);
  private readonly storage = inject(StorageService);
  private readonly notificationsFacade = inject(NotificationsFacade);

  /** Estado de apertura del sidebar (mobile). */
  readonly sidebarOpen = signal(true);

  /** Cantidad de notificaciones no leídas (derivada del facade). */
  readonly unreadCount = computed(() => this.notificationsFacade.unreadCount());

  ngOnInit(): void {
    const token = this.storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
    if (token) {
      this.wsService.connect(token);
      // Start listening realtime notifications after connecting socket
      this.notificationsFacade.initRealtimeNotifications();
      // Load existing notifications to populate badge/count
      this.notificationsFacade.loadNotifications();
    }
  }

  /**
   * Alterna la visibilidad del sidebar en mobile.
   */
  toggleSidebar(): void {
    this.sidebarOpen.update((v) => !v);
  }
}
