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
import { RealtimeService } from '@core/services/realtime.service';
import { Subscription } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class VehiclesFacade {
  private readonly vehiclesService = inject(VehiclesService);
  private readonly toastService = inject(ToastService);
  private readonly realtime = inject(RealtimeService);
  private realtimeSub?: Subscription;

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
        next: (res) => {
          // Normalize backend fields -> frontend `Vehicle` shape
          const list = (res.data || []).map((raw: any) => {
            const v: any = raw || {};
            return ({
              id: v.id || v.vehicle_id || v._id,
              userId: v.user_id || v.userId,
              brand: v.make || v.brand,
              model: v.model,
              year: v.year || new Date().getFullYear(),
              color: v.color || 'unknown',
              plate: v.plate,
              imageUrl: v.image_url || v.imageUrl,
              isActive: !!v.active,
              brandCatalogId: v.brand_catalog_id || v.brandCatalogId,
              modelCatalogId: v.model_catalog_id || v.modelCatalogId,
              createdAt: v.created_at || v.createdAt,
            } as Vehicle);
          });
          this.vehicles.set(list);
        },
        error: () => this.toastService.error('Error cargando vehículos.'),
      });
  }

  constructor() {
    // subscribe to realtime events to refresh vehicles on relevant updates
    try {
      this.realtimeSub = this.realtime.events$.subscribe((ev) => {
        if (['vehicle:activated','vehicle:deleted','user:updated','user:created'].includes(ev.type)) {
          this.loadVehicles();
        }
      });
    } catch (e) {}
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
  }

  /**
   * Crea un nuevo vehículo y lo agrega a la lista.
   * @param payload Datos del vehículo.
   */
  createVehicle(payload: VehiclePayload): void {
    // Prevent creating more than 3 vehicles on client side (defensive)
    const current = this.vehicles() || [];
    if (current.length >= 3) {
      this.toastService.error('Ya tienes el máximo de 3 vehículos registrados');
      return;
    }
    this.isSaving.set(true);
    this.vehiclesService.createVehicle(payload)
      .pipe(finalize(() => this.isSaving.set(false)))
      .subscribe({
        next: ({ data }) => {
          const raw: any = data || {};
          const normalized: Vehicle = {
            id: raw.id,
            userId: raw.user_id || raw.userId,
            brand: raw.make || raw.brand,
            model: raw.model,
            year: raw.year || new Date().getFullYear(),
            color: raw.color || 'unknown',
            plate: raw.plate,
            imageUrl: raw.image_url || raw.imageUrl,
            isActive: !!raw.active,
            brandCatalogId: raw.brand_catalog_id || raw.brandCatalogId,
            modelCatalogId: raw.model_catalog_id || raw.modelCatalogId,
            createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
          };
          this.vehicles.update((list) => [...(list || []), normalized]);
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
    if (!id) { this.toastService.error('Vehicle id missing'); return; }
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
