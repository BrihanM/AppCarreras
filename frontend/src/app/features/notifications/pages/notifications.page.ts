/**
 * @fileoverview Página del centro de notificaciones.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationsFacade } from '../facades/notifications.facade';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'srx-notifications-page',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, EmptyStateComponent],
  templateUrl: './notifications.page.html',
  styleUrl: './notifications.page.scss',
})
export class NotificationsPage implements OnInit {
  readonly facade = inject(NotificationsFacade);

  ngOnInit(): void {
    this.facade.loadNotifications();
  }
}
