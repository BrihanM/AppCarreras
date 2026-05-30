/**
 * @fileoverview Modelos de dominio para vehículos.
 */

/** Vehículo registrado por un piloto. */
export interface Vehicle {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  plate?: string;
  imageUrl?: string;
  isActive: boolean;
  brandCatalogId?: string;
  modelCatalogId?: string;
  categoryId?: string;
  categoryName?: string;
  createdAt: string;
}

/** Payload para crear o actualizar un vehículo. */
export interface VehiclePayload {
  brand: string;
  model: string;
  brandCatalogId?: string;
  modelCatalogId?: string;
  year: number;
  color: string;
  plate?: string;
  imageUrl?: string;
  categoryId?: string;
}
