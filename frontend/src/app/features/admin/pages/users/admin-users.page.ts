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
  templateUrl: './admin-users.page.html',
  styleUrls: ['./admin-users.page.scss'],
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
