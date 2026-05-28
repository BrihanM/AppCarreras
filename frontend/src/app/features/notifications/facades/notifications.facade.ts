/**
 * @fileoverview Facade de Notificaciones.
 * Gestiona el estado reactivo de notificaciones y los eventos en tiempo real del WebSocket.
 *
 * @description
 * - Escucha eventos 'notification:new' del WebSocket y los agrega al Signal.
 * - Expone el contador de no leídas para el badge del Navbar.
 *
 * @class NotificationsFacade
 */
import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NotificationsService } from '../services/notifications.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { ToastService } from '@core/services/toast.service';
import { Notification } from '@shared/interfaces';
import { SocketEvent } from '@shared/enums/app.enums';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade implements OnDestroy {
  private readonly notificationsService = inject(NotificationsService);
  private readonly wsService = inject(WebSocketService);
  private readonly toastService = inject(ToastService);
  private wsSub?: Subscription;

  readonly isLoading = signal(false);
  readonly notifications = signal<Notification[]>([]);

  /** Computed Signal: cantidad de notificaciones no leídas. */
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length
  );

  /** Inicializa la escucha de notificaciones en tiempo real. */
  initRealtimeNotifications(): void {
    this.wsSub = this.wsService
      .on<Notification>(SocketEvent.NotificationNew)
      .subscribe((notification) => {
        this.notifications.update((list) => [notification, ...list]);
        this.toastService.info(notification.message);
      });
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    this.notificationsService.getNotifications()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.notifications.set(res.data),
        error: () => this.toastService.error('Error cargando notificaciones.'),
      });
  }

  /**
   * Marca una notificación individual como leída.
   * @param id ID de la notificación.
   */
  markAsRead(id: string): void {
    // Optimistic UI
    this.notifications.update((list) =>
      list.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    this.notificationsService.markAsRead(id).subscribe({
      error: () => {
        // Rollback si falla
        this.notifications.update((list) =>
          list.map((n) => (n.id === id ? { ...n, isRead: false } : n))
        );
      },
    });
  }

  /** Marca todas las notificaciones como leídas. */
  markAllAsRead(): void {
    this.notifications.update((list) => list.map((n) => ({ ...n, isRead: true })));
    this.notificationsService.markAllAsRead().subscribe({
      next: () => this.toastService.success('Todas las notificaciones leídas.'),
    });
  }

  ngOnDestroy(): void {
    this.wsSub?.unsubscribe();
  }
}
