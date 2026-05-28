/**
 * @fileoverview Modelos de dominio para categorías de vehículos.
 */

/** Categoría de vehículo creada por el administrador. */
export interface Category {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

/** Payload para crear o actualizar una categoría. */
export interface CategoryPayload {
  name: string;
  description?: string;
}
