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
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { NotificationsService } from '../services/notifications.service';
import { AuthService } from '@core/services/auth.service';
import { WebSocketService } from '@core/websocket/websocket.service';
import { ToastService } from '@core/services/toast.service';
import type { Notification as AppNotification } from '@shared/interfaces';
import { SocketEvent } from '@shared/enums/app.enums';

@Injectable({ providedIn: 'root' })
export class NotificationsFacade implements OnDestroy {
  private readonly notificationsService = inject(NotificationsService);
  private readonly wsService = inject(WebSocketService);
  private readonly toastService = inject(ToastService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private wsSub?: Subscription;

  readonly isLoading = signal(false);
  readonly notifications = signal<AppNotification[]>([]);

  /** Computed Signal: cantidad de notificaciones no leídas. */
  readonly unreadCount = computed(
    () => this.notifications().filter((n) => !n.isRead).length
  );

  /** Inicializa la escucha de notificaciones en tiempo real. */
  initRealtimeNotifications(): void {
    this.wsSub = this.wsService
      .on<AppNotification>(SocketEvent.NotificationNew)
      .subscribe((notification: AppNotification) => {
        console.debug('[WS] received notification:new', notification);
        this.notifications.update((list) => [notification, ...list]);
        this.toastService.info(notification.message);
        this.showBrowserNotification(notification);
      });
  }

  private showBrowserNotification(n: AppNotification): void {
    try {
      if (!('Notification' in window)) return;
      const display = () => {
        const notif = new Notification(n.title || 'Nueva notificación', { body: (n as any).message });
        notif.onclick = () => {
          try { window.focus(); this.router.navigate(['/notifications']); } catch (e) {}
        };
      };

      if (Notification.permission === 'granted') {
        display();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((p) => { if (p === 'granted') display(); });
      }
    } catch (e) {
      // ignore if browser blocks or in SSR
    }
  }

  loadNotifications(): void {
    this.isLoading.set(true);
    const userId = this.authService.currentUser()?.id;
    if (!userId) {
      this.isLoading.set(false);
      this.toastService.error('Usuario no autenticado.');
      return;
    }

    this.notificationsService.getNotifications(userId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.notifications.set(res.data as AppNotification[]),
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
