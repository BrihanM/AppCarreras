/**
 * @fileoverview Página de gestión de categorías de vehículos (Admin).
 */
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { APP_ROUTES } from '@core/constants/app.constants';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { Category } from '@shared/interfaces';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'srx-admin-categories-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent, RouterLink],
  templateUrl: './admin-categories.page.html',
  styleUrls: ['./admin-categories.page.scss'],
})
export class AdminCategoriesPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);

  readonly editingId = signal<string | null>(null);

  readonly editForm = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [],
  });

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
    isActive: [true],
  });

  readonly createModal = signal(false);

  readonly routes = APP_ROUTES;

  ngOnInit(): void {
    this.adminService.getCategories().subscribe({
      next: (res) => {
        // Map backend snake_case to frontend camelCase
        const mapped = res.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          description: c.description ?? undefined,
          isActive: typeof c.is_active !== 'undefined' ? Boolean(c.is_active) : true,
          createdAt: c.created_at ?? new Date().toISOString(),
        }));
        this.categories.set(mapped);
      },
    });
  }

  createCategory(): void {
    if (this.form.invalid) return;
    const { name, description } = this.form.getRawValue();
    this.adminService.createCategory({ name: name!, description: description || undefined, is_active: true }).subscribe({
      next: ({ data }) => {
        // map returned row to camelCase (server may return snake_case)
        const d: any = data as any;
        const item = { id: d.id, name: d.name, description: d.description ?? undefined, isActive: !!d.is_active, createdAt: d.created_at ?? new Date().toISOString() };
        this.categories.update((list) => [...list, item]);
        this.form.reset();
        this.toastService.success('Categoría creada.');
        this.closeCreateModal();
      },
      error: () => this.toastService.error('Error al crear categoría.'),
    });
  }

  openCreateModal(): void {
    this.form.reset({ isActive: true });
    this.createModal.set(true);
  }

  closeCreateModal(): void {
    this.createModal.set(false);
  }

  toggleActive(cat: Category): void {
    const prev = this.categories();
    const newState = !cat.isActive;
    this.adminService.updateCategory(cat.id, { name: cat.name, description: cat.description, is_active: newState }).subscribe({
      next: ({ data }) => {
        const d: any = data as any;
        this.categories.update((list) => list.map((c) => (c.id === cat.id ? { ...c, isActive: !!d.is_active } : c)));
        this.toastService.success('Estado actualizado.');
      },
      error: () => { this.categories.set(prev); this.toastService.error('Error al actualizar estado.'); },
    });
  }

  startEdit(cat: Category): void {
    this.editingId.set(cat.id);
    this.editForm.patchValue({ name: cat.name, description: cat.description || '' });
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editForm.reset();
  }

  saveEdit(id: string): void {
    if (this.editForm.invalid) return;
    const { name, description } = this.editForm.getRawValue();
    const prev = this.categories();
    this.adminService.updateCategory(id, { name: name!, description: description || undefined }).subscribe({
      next: ({ data }) => {
        const d: any = data as any;
        const mapped = { id: d.id, name: d.name, description: d.description ?? undefined, isActive: !!d.is_active, createdAt: d.created_at ?? new Date().toISOString() };
        this.categories.update((list) => list.map((c) => (c.id === id ? mapped : c)));
        this.toastService.success('Categoría actualizada.');
        this.cancelEdit();
      },
      error: () => {
        this.categories.set(prev);
        this.toastService.error('Error al actualizar categoría.');
      },
    });
  }

  deleteCategory(id: string): void {
    const prev = this.categories();
    this.categories.update((list) => list.filter((c) => c.id !== id));
    this.adminService.deleteCategory(id).subscribe({
      error: () => { this.categories.set(prev); this.toastService.error('Error al eliminar.'); },
    });
  }
}
