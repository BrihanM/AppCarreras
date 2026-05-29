/**
 * @fileoverview Página de gestión de usuarios (Admin).
 */
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { User } from '@shared/interfaces';
import { SkeletonComponent } from '../../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'srx-admin-users-page',
  standalone: true,
  imports: [CommonModule, SkeletonComponent, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <h1 class="page-title">👥 Gestión de Usuarios</h1>
      @if (isLoading()) {
        <div class="list">
          @for (i of [1,2,3,4,5]; track i) {
            <div class="row-skeleton">
              <srx-skeleton width="40px" height="40px" borderRadius="50%" />
              <div class="row-skeleton__info">
                <srx-skeleton width="200px" height="14px" />
                <srx-skeleton width="150px" height="12px" />
              </div>
              <srx-skeleton width="80px" height="30px" borderRadius="8px" />
            </div>
          }
        </div>
      } @else if (users().length === 0) {
        <srx-empty-state icon="👥" title="Sin usuarios" message="No hay usuarios registrados." />
      } @else {
        <div class="list">
          @for (user of users(); track user.id) {
            <div class="user-row">
              <div class="user-row__avatar">{{ user?.username?.charAt(0)?.toUpperCase() }}</div>
              <div class="user-row__info">
                <p class="user-row__name">{{ user.username }}</p>
                <p class="user-row__email">{{ user.email }} · {{ user.role }}</p>
              </div>
              <div class="user-row__actions">
                <span class="status-badge status-badge--{{ user.status }}">{{ user.status }}</span>
                <button class="btn-danger" (click)="deleteUser(user.id)">Eliminar</button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 1000px; margin: 0 auto; }
    .page-title { font-size: 1.75rem; font-weight: 900; color: #fff; margin: 0 0 1.5rem; }
    .list { display: flex; flex-direction: column; gap: 0.75rem; }
    .row-skeleton { display: flex; align-items: center; gap: 1rem; padding: 1rem;
      background: rgba(255,255,255,0.03); border-radius: 12px; }
    .row-skeleton__info { flex: 1; display: flex; flex-direction: column; gap: 0.5rem; }
    .user-row { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.25rem;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 12px; }
    .user-row__avatar { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #ff3200, #ff6600); color: #fff;
      font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .user-row__info { flex: 1; }
    .user-row__name { font-size: 0.9rem; font-weight: 600; color: #fff; margin: 0; }
    .user-row__email { font-size: 0.75rem; color: var(--color-text-muted, #888); margin: 0; }
    .user-row__actions { display: flex; align-items: center; gap: 0.75rem; }
    .status-badge { font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.625rem;
      border-radius: 20px; text-transform: uppercase;
      &--active { background: rgba(0,255,136,0.15); color: #00ff88; }
      &--suspended { background: rgba(255,50,50,0.15); color: #ff5555; }
      &--pending { background: rgba(255,165,0,0.15); color: #ffa500; } }
    .btn-danger { padding: 0.375rem 0.75rem; border: 1px solid rgba(255,50,50,0.4);
      border-radius: 8px; background: transparent; color: #ff5555; font-size: 0.8rem;
      font-weight: 600; cursor: pointer;
      &:hover { background: rgba(255,50,50,0.1); } }
  `],
})
export class AdminUsersPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly users = signal<User[]>([]);

  ngOnInit(): void {
    this.isLoading.set(true);
    this.adminService.getAllUsers().subscribe({
      next: (res) => { this.users.set(res.data); this.isLoading.set(false); },
      error: () => { this.toastService.error('Error cargando usuarios.'); this.isLoading.set(false); },
    });
  }

  deleteUser(id: string): void {
    const prev = this.users();
    this.users.update((list) => list.filter((u) => u.id !== id));
    this.adminService.deleteUser(id).subscribe({
      next: () => this.toastService.success('Usuario eliminado.'),
      error: () => { this.users.set(prev); this.toastService.error('Error al eliminar usuario.'); },
    });
  }
}
