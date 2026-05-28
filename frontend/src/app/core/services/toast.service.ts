/**
 * @fileoverview Servicio de notificaciones toast para feedback visual al usuario.
 * Gestiona una cola de mensajes reactivos usando Signals.
 *
 * @class ToastService
 */
import { Injectable, signal } from '@angular/core';

/** Tipos de toast disponibles. */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/** Modelo de un mensaje toast. */
export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  /** Signal con la lista de toasts activos. */
  readonly toasts = signal<Toast[]>([]);

  /**
   * Muestra un toast de éxito.
   * @param message Mensaje a mostrar.
   * @param duration Duración en ms (default 3000).
   */
  success(message: string, duration = 3000): void {
    this.add({ type: 'success', message, duration });
  }

  /**
   * Muestra un toast de error.
   * @param message Mensaje a mostrar.
   * @param duration Duración en ms (default 4000).
   */
  error(message: string, duration = 4000): void {
    this.add({ type: 'error', message, duration });
  }

  /**
   * Muestra un toast de advertencia.
   * @param message Mensaje a mostrar.
   * @param duration Duración en ms (default 3500).
   */
  warning(message: string, duration = 3500): void {
    this.add({ type: 'warning', message, duration });
  }

  /**
   * Muestra un toast informativo.
   * @param message Mensaje a mostrar.
   */
  info(message: string, duration = 3000): void {
    this.add({ type: 'info', message, duration });
  }

  /**
   * Elimina un toast por su ID.
   * @param id Identificador del toast.
   */
  dismiss(id: string): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private add(toast: Omit<Toast, 'id'>): void {
    const id = crypto.randomUUID();
    this.toasts.update((list) => [...list, { ...toast, id }]);
    setTimeout(() => this.dismiss(id), toast.duration ?? 3000);
  }
}
