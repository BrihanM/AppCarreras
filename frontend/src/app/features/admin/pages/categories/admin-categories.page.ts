/**
 * @fileoverview Página de gestión de categorías de vehículos (Admin).
 */
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '@core/services/toast.service';
import { Category } from '@shared/interfaces';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'srx-admin-categories-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, EmptyStateComponent],
  template: `
    <div class="admin-page">
      <div class="page-header">
        <h1 class="page-title">📂 Categorías de Vehículos</h1>
      </div>

      <!-- Formulario crear -->
      <form class="create-form" [formGroup]="form" (ngSubmit)="createCategory()">
        <input class="form-input" formControlName="name" placeholder="Nombre de categoría..." />
        <input class="form-input" formControlName="description" placeholder="Descripción (opcional)" />
        <button type="submit" class="btn-primary" [disabled]="form.invalid">+ Crear</button>
      </form>

      <!-- Lista de categorías -->
      @if (categories().length === 0) {
        <srx-empty-state icon="📂" title="Sin categorías" message="Crea la primera categoría de vehículos." />
      } @else {
        <div class="list">
          @for (cat of categories(); track cat.id) {
            <div class="cat-row">
              <div class="cat-row__info">
                <p class="cat-row__name">{{ cat.name }}</p>
                <p class="cat-row__desc">{{ cat.description ?? 'Sin descripción' }}</p>
              </div>
              <button class="btn-danger" (click)="deleteCategory(cat.id)">Eliminar</button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .admin-page { max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; gap: 1.5rem; }
    .page-title { font-size: 1.75rem; font-weight: 900; color: #fff; margin: 0; }
    .create-form { display: flex; gap: 0.75rem; flex-wrap: wrap; }
    .form-input { flex: 1; min-width: 200px; padding: 0.625rem 1rem;
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none;
      &::placeholder { color: rgba(255,255,255,0.3); }
      &:focus { border-color: var(--color-accent, #ff3200); } }
    .btn-primary { padding: 0.625rem 1.25rem; background: linear-gradient(135deg, #ff3200, #ff6600);
      border: none; border-radius: 8px; color: #fff; font-weight: 700; cursor: pointer;
      &:disabled { opacity: 0.6; cursor: not-allowed; } }
    .list { display: flex; flex-direction: column; gap: 0.625rem; }
    .cat-row { display: flex; align-items: center; gap: 1rem; padding: 0.875rem 1.25rem;
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07);
      border-radius: 10px; }
    .cat-row__info { flex: 1; }
    .cat-row__name { font-size: 0.9rem; font-weight: 600; color: #fff; margin: 0; }
    .cat-row__desc { font-size: 0.8rem; color: var(--color-text-muted, #888); margin: 0; }
    .btn-danger { padding: 0.375rem 0.75rem; border: 1px solid rgba(255,50,50,0.4);
      border-radius: 8px; background: transparent; color: #ff5555; font-size: 0.8rem;
      font-weight: 600; cursor: pointer; flex-shrink: 0;
      &:hover { background: rgba(255,50,50,0.1); } }
  `],
})
export class AdminCategoriesPage implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly categories = signal<Category[]>([]);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    description: [''],
  });

  ngOnInit(): void {
    this.adminService.getCategories().subscribe({
      next: (res) => this.categories.set(res.data),
    });
  }

  createCategory(): void {
    if (this.form.invalid) return;
    const { name, description } = this.form.getRawValue();
    this.adminService.createCategory({ name: name!, description: description || undefined }).subscribe({
      next: ({ data }) => {
        this.categories.update((list) => [...list, data]);
        this.form.reset();
        this.toastService.success('Categoría creada.');
      },
      error: () => this.toastService.error('Error al crear categoría.'),
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
