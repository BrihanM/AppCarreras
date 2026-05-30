/**
 * @fileoverview Página de gestión de vehículos del piloto.
 * Galería de vehículos con cards visuales, activación y eliminación.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VehiclesFacade } from '../facades/vehicles.facade';
import { VehiclesService } from '../services/vehicles.service';
import { SkeletonComponent } from '../../../shared/components/ui/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../../shared/components/ui/empty-state/empty-state.component';
import { VehiclePayload } from '@shared/interfaces';

@Component({
  selector: 'srx-vehicles-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SkeletonComponent, EmptyStateComponent],
  templateUrl: './vehicles.page.html',
  styleUrl: './vehicles.page.scss',
})
export class VehiclesPage implements OnInit {
  readonly facade = inject(VehiclesFacade);
  private readonly fb = inject(FormBuilder);
  private readonly vehiclesService = inject(VehiclesService);

  /** Controla la visibilidad del modal de creación. */
  showCreateModal = false;
  brands: any[] = [];
  models: any[] = [];

  readonly form = this.fb.nonNullable.group({
    brandCatalogId: ['', [Validators.required]],
    modelCatalogId: ['', [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1950), Validators.max(new Date().getFullYear() + 1)]],
    color: ['', [Validators.required]],
    plate: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{3}\d{3}$/)]],
  });

  ngOnInit(): void {
    this.facade.loadVehicles();
    this.loadBrands();
  }

  loadBrands(): void {
    this.vehiclesService.getBrands(true).subscribe((rows) => {
      this.brands = rows || [];
      const selected = this.form.controls.brandCatalogId.value;
      if (selected) this.onBrandChange(selected);
    });
  }

  onBrandChange(brandId: string): void {
    this.form.patchValue({ modelCatalogId: '' });
    this.vehiclesService.getModels(brandId, true).subscribe((rows) => {
      this.models = rows || [];
    });
  }

  // Safe accessors for template to avoid reading properties of undefined
  get vehiclesCount(): number {
    try { return this.facade.vehicles()?.length ?? 0; } catch { return 0; }
  }

  get vehiclesList() {
    try { return this.facade.vehicles() || []; } catch { return []; }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const raw = this.form.getRawValue();
    const brand = this.brands.find((b) => b.id === raw.brandCatalogId);
    const model = this.models.find((m) => m.id === raw.modelCatalogId);
    if (!brand || !model) {
      this.form.markAllAsTouched();
      return;
    }
    const payload: VehiclePayload = {
      brand: brand.name,
      model: model.name,
      brandCatalogId: raw.brandCatalogId,
      modelCatalogId: raw.modelCatalogId,
      year: raw.year!,
      color: raw.color!,
      plate: (raw.plate || '').toUpperCase() || undefined,
    };
    this.facade.createVehicle(payload);
    this.closeModal();
  }

  openModal(): void { this.showCreateModal = true; }
  closeModal(): void {
    this.showCreateModal = false;
    this.form.reset({ brandCatalogId: '', modelCatalogId: '', year: new Date().getFullYear(), color: '', plate: '' });
    this.models = [];
  }
}
