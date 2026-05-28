/**
 * @fileoverview Servicio de almacenamiento local tipado.
 * Abstrae el acceso a localStorage con serialización/deserialización automática.
 *
 * @class StorageService
 */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  /**
   * Guarda un valor en localStorage con serialización JSON.
   * @param key Clave de almacenamiento.
   * @param value Valor a persistir.
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`[Storage] Error al guardar clave: ${key}`);
    }
  }

  /**
   * Recupera un valor de localStorage y lo deserializa.
   * @param key Clave de almacenamiento.
   * @returns Valor tipado o null si no existe.
   */
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  }

  /**
   * Elimina una clave específica de localStorage.
   * @param key Clave a eliminar.
   */
  remove(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Limpia todo el localStorage de la aplicación.
   */
  clear(): void {
    localStorage.clear();
  }
}
