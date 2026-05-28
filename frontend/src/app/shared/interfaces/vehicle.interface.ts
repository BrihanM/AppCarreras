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
  horsepower?: number;
  categoryId?: string;
  categoryName?: string;
  createdAt: string;
}

/** Payload para crear o actualizar un vehículo. */
export interface VehiclePayload {
  brand: string;
  model: string;
  year: number;
  color: string;
  plate?: string;
  imageUrl?: string;
  horsepower?: number;
  categoryId?: string;
}
