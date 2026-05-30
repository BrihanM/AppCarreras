/**
 * @fileoverview Página admin para gestión global de retos con filtros por estado.
 */
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { APP_ROUTES } from '@core/constants/app.constants';
import { ToastService } from '@core/services/toast.service';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';
import { AdminChallenge, AdminService } from '../../services/admin.service';

@Component({
  selector: 'srx-admin-challenges-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, EmptyStateComponent],
  templateUrl: './admin-challenges.page.html',
  styleUrls: ['./admin-challenges.page.scss'],
})
export class AdminChallengesPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly routes = APP_ROUTES;
  readonly isLoading = signal(false);
  readonly challenges = signal<AdminChallenge[]>([]);
  readonly editingId = signal<string | null>(null);

  status = '';
  search = '';

  readonly editForm = this.fb.group({
    status: ['pending'],
    winnerId: [''],
    agreedLocation: [''],
    agreedDate: [''],
    notes: [''],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.admin.getAdminChallenges({ status: this.status || undefined, search: this.search || undefined, limit: 50 }).subscribe({
      next: (res) => {
        this.challenges.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los retos.');
        this.isLoading.set(false);
      },
    });
  }

  openEdit(item: AdminChallenge): void {
    this.editingId.set(item.id);
    this.editForm.setValue({
      status: item.status || 'pending',
      winnerId: item.winnerId || '',
      agreedLocation: item.agreedLocation || '',
      agreedDate: item.agreedDate ? String(item.agreedDate).slice(0, 16) : '',
      notes: item.notes || '',
    });
  }

  closeEdit(): void {
    this.editingId.set(null);
    this.editForm.reset({ status: 'pending', winnerId: '', agreedLocation: '', agreedDate: '', notes: '' });
  }

  saveEdit(): void {
    const id = this.editingId();
    if (!id) return;
    const raw = this.editForm.getRawValue();
    const payload = {
      status: raw.status || undefined,
      winnerId: raw.winnerId || undefined,
      agreedLocation: raw.agreedLocation || undefined,
      agreedDate: raw.agreedDate || undefined,
      notes: raw.notes || undefined,
    };
    this.admin.updateAdminChallenge(id, payload).subscribe({
      next: () => {
        this.toast.success('Reto actualizado.');
        this.closeEdit();
        this.load();
      },
      error: () => this.toast.error('No se pudo actualizar el reto.'),
    });
  }

  removeChallenge(id: string): void {
    if (!confirm('¿Eliminar este reto?')) return;
    const prev = this.challenges();
    this.challenges.update((list) => list.filter((c) => c.id !== id));
    this.admin.deleteAdminChallenge(id).subscribe({
      next: () => this.toast.success('Reto eliminado.'),
      error: () => {
        this.challenges.set(prev);
        this.toast.error('No se pudo eliminar el reto.');
      },
    });
  }
}
