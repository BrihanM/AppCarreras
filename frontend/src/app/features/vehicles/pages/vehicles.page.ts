/**
 * @fileoverview Página de gestión de vehículos del piloto.
 * Galería de vehículos con cards visuales, activación y eliminación.
 */
import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { VehiclesFacade } from '../facades/vehicles.facade';
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

  /** Controla la visibilidad del modal de creación. */
  showCreateModal = false;

  readonly form = this.fb.group({
    make: ['', [Validators.required]],
    model: ['', [Validators.required]],
    year: [new Date().getFullYear(), [Validators.required, Validators.min(1950), Validators.max(new Date().getFullYear() + 1)]],
    color: ['', [Validators.required]],
    plate: ['', [Validators.required, Validators.pattern(/^[A-Za-z]{3}\d{3}$/)]],
    horsepower: [null as number | null],
  });

  ngOnInit(): void {
    this.facade.loadVehicles();
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
    const payload: VehiclePayload = {
      brand: raw.make!, // align form (make) with backend `make` by mapping to `brand` for existing types
      model: raw.model!,
      year: raw.year!,
      color: raw.color!,
      plate: (raw.plate || '').toUpperCase() || undefined,
      horsepower: raw.horsepower || undefined,
    };
    this.facade.createVehicle(payload);
    this.closeModal();
  }

  openModal(): void { this.showCreateModal = true; }
  closeModal(): void {
    this.showCreateModal = false;
    this.form.reset({ year: new Date().getFullYear() });
  }
}
