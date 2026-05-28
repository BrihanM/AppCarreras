/**
 * @fileoverview Facade del módulo de Vehículos.
 * Gestiona el estado reactivo de la lista de vehículos y las operaciones CRUD.
 *
 * @class VehiclesFacade
 */
import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { VehiclesService } from '../services/vehicles.service';
import { ToastService } from '@core/services/toast.service';
import { Vehicle, VehiclePayload } from '@shared/interfaces';

@Injectable({ providedIn: 'root' })
export class VehiclesFacade {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly toastService = inject(ToastService);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly vehicles = signal<Vehicle[]>([]);
  readonly selectedVehicle = signal<Vehicle | null>(null);

  /** Carga los vehículos del piloto autenticado. */
  loadVehicles(): void {
    this.isLoading.set(true);
    this.vehiclesService.getMyVehicles()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.vehicles.set(res.data),
        error: () => this.toastService.error('Error cargando vehículos.'),
      });
  }

  /**
   * Crea un nuevo vehículo y lo agrega a la lista.
   * @param payload Datos del vehículo.
   */
  createVehicle(payload: VehiclePayload): void {
    this.isSaving.set(true);
    this.vehiclesService.createVehicle(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: ({ data }) => {
          this.vehicles.update((list) => [...list, data]);
          this.toastService.success('Vehículo registrado. ¡Listo para correr!');
        },
        error: () => this.toastService.error('Error al registrar el vehículo.'),
      });
  }

  /**
   * Activa un vehículo como el principal.
   * @param id ID del vehículo.
   */
  activateVehicle(id: string): void {
    this.vehiclesService.activateVehicle(id).subscribe({
      next: ({ data }) => {
        this.vehicles.update((list) =>
          list.map((v) => ({ ...v, isActive: v.id === data.id }))
        );
        this.toastService.success('Vehículo activado como principal.');
      },
      error: () => this.toastService.error('Error al activar el vehículo.'),
    });
  }

  /**
   * Elimina un vehículo de la lista con confirmación optimista.
   * @param id ID del vehículo a eliminar.
   */
  deleteVehicle(id: string): void {
    // Optimistic UI: eliminar de la lista inmediatamente
    const previous = this.vehicles();
    this.vehicles.update((list) => list.filter((v) => v.id !== id));

    this.vehiclesService.deleteVehicle(id).subscribe({
      next: () => this.toastService.success('Vehículo eliminado.'),
      error: () => {
        // Rollback en caso de error
        this.vehicles.set(previous);
        this.toastService.error('Error al eliminar el vehículo.');
      },
    });
  }
}
