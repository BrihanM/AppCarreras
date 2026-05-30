/**
 * @fileoverview Página admin para gestión global de vehículos.
 */
import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { APP_ROUTES } from '@core/constants/app.constants';
import { ToastService } from '@core/services/toast.service';
import { AdminService, AdminVehicle, VehicleCatalogItem } from '../../services/admin.service';
import { EmptyStateComponent } from '../../../../shared/components/ui/empty-state/empty-state.component';

@Component({
  selector: 'srx-admin-vehicles-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, EmptyStateComponent],
  templateUrl: './admin-vehicles.page.html',
  styleUrls: ['./admin-vehicles.page.scss'],
})
export class AdminVehiclesPage implements OnInit {
  private readonly admin = inject(AdminService);
  private readonly toast = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  readonly routes = APP_ROUTES;
  readonly isLoading = signal(false);
  readonly vehicles = signal<AdminVehicle[]>([]);
  readonly editingId = signal<string | null>(null);
  readonly brands = signal<VehicleCatalogItem[]>([]);
  readonly models = signal<VehicleCatalogItem[]>([]);
  readonly catalog = signal<VehicleCatalogItem[]>([]);

  search = '';
  newBrandName = '';
  newModelName = '';
  selectedBrandForModel = '';

  readonly editForm = this.fb.nonNullable.group({
    user_id: ['', Validators.required],
    brand_catalog_id: ['', Validators.required],
    model_catalog_id: ['', Validators.required],
    plate: ['', Validators.required],
    active: [false],
  });

  ngOnInit(): void {
    this.load();
    this.loadCatalog();
  }

  load(): void {
    this.isLoading.set(true);
    this.admin.getAdminVehicles({ search: this.search || undefined, limit: 50 }).subscribe({
      next: (res) => {
        this.vehicles.set(res.data || []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toast.error('No se pudieron cargar los vehículos.');
        this.isLoading.set(false);
      },
    });
  }

  openEdit(v: AdminVehicle): void {
    this.editingId.set(v.id);
    const selectedBrandId = v.brand_catalog_id || '';
    this.editForm.setValue({
      user_id: v.user_id,
      brand_catalog_id: selectedBrandId,
      model_catalog_id: v.model_catalog_id || '',
      plate: v.plate,
      active: !!v.active,
    });
    if (selectedBrandId) this.onBrandChange(selectedBrandId);
  }

  closeEdit(): void {
    this.editingId.set(null);
    this.editForm.reset({ user_id: '', brand_catalog_id: '', model_catalog_id: '', plate: '', active: false });
    this.models.set([]);
  }

  loadCatalog(): void {
    this.admin.getVehicleBrands(false).subscribe({
      next: (res) => this.brands.set(res.data || []),
      error: () => this.toast.error('No se pudieron cargar las marcas.'),
    });
    this.admin.getVehicleCatalog().subscribe({
      next: (res) => this.catalog.set(res.data || []),
      error: () => this.toast.error('No se pudo cargar el catálogo de vehículos.'),
    });
  }

  onBrandChange(brandId: string): void {
    this.editForm.patchValue({ model_catalog_id: '' });
    if (!brandId) {
      this.models.set([]);
      return;
    }
    this.admin.getVehicleModels(brandId, false).subscribe({
      next: (res) => this.models.set(res.data || []),
      error: () => {
        this.models.set([]);
        this.toast.error('No se pudieron cargar los modelos de la marca.');
      },
    });
  }

  saveEdit(): void {
    const id = this.editingId();
    if (!id || this.editForm.invalid) return;
    const payload = this.editForm.getRawValue();
    this.admin.updateAdminVehicle(id, payload).subscribe({
      next: () => {
        this.toast.success('Vehículo actualizado.');
        this.closeEdit();
        this.load();
      },
      error: () => this.toast.error('No se pudo actualizar el vehículo.'),
    });
  }

  createBrand(): void {
    const name = this.newBrandName.trim();
    if (!name) return;
    this.admin.createVehicleCatalog({ type: 'brand', name, is_active: true }).subscribe({
      next: () => {
        this.toast.success('Marca creada.');
        this.newBrandName = '';
        this.loadCatalog();
      },
      error: () => this.toast.error('No se pudo crear la marca.'),
    });
  }

  createModel(): void {
    const name = this.newModelName.trim();
    if (!name || !this.selectedBrandForModel) return;
    this.admin.createVehicleCatalog({
      type: 'model',
      name,
      parent_id: this.selectedBrandForModel,
      is_active: true,
    }).subscribe({
      next: () => {
        this.toast.success('Modelo creado.');
        this.newModelName = '';
        this.loadCatalog();
      },
      error: () => this.toast.error('No se pudo crear el modelo.'),
    });
  }

  toggleCatalog(item: VehicleCatalogItem): void {
    this.admin.updateVehicleCatalog(item.id, { is_active: !item.is_active }).subscribe({
      next: () => {
        this.toast.success(item.is_active ? 'Desactivado.' : 'Activado.');
        this.loadCatalog();
      },
      error: () => this.toast.error('No se pudo actualizar el estado del catálogo.'),
    });
  }

  removeVehicle(id: string): void {
    if (!confirm('¿Eliminar este vehículo?')) return;
    const prev = this.vehicles();
    this.vehicles.update((list) => list.filter((v) => v.id !== id));
    this.admin.deleteAdminVehicle(id).subscribe({
      next: () => this.toast.success('Vehículo eliminado.'),
      error: () => {
        this.vehicles.set(prev);
        this.toast.error('No se pudo eliminar el vehículo.');
      },
    });
  }
}
