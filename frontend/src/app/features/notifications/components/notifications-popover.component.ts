import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationsFacade } from '../facades/notifications.facade';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';

@Component({
  selector: 'srx-notifications-popover',
  standalone: true,
  imports: [CommonModule, RouterLink, SkeletonComponent],
  templateUrl: './notifications-popover.component.html',
  styleUrls: ['./notifications-popover.component.scss'],
})
export class NotificationsPopoverComponent {
  private readonly facade = inject(NotificationsFacade);

  readonly notifications = this.facade.notifications;
  readonly isLoading = this.facade.isLoading;
  readonly unreadCount = this.facade.unreadCount;

  open(): void {
    this.facade.loadNotifications();
  }

  markAsRead(id: string): void {
    this.facade.markAsRead(id);
  }

  markAll(): void {
    this.facade.markAllAsRead();
  }
}
