/**
 * @fileoverview Interfaces de respuesta estándar de la API REST.
 * Define los contratos de datos que devuelve el backend.
 */

/**
 * Respuesta genérica envuelta del servidor.
 * @template T Tipo del dato contenido en la respuesta.
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * Respuesta paginada del servidor.
 * @template T Tipo de cada elemento de la lista.
 */
export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}

/** Metadata de paginación. */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Error estándar de la API. */
export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}
