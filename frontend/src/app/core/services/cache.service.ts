import { Injectable } from '@angular/core';

export interface CacheEntry<T = any> {
  value: T;
  expiresAt: number; // timestamp ms
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly map = new Map<string, CacheEntry>();
  private readonly defaultTtl = 60 * 1000; // 60s

  get<T = any>(key: string): T | null {
    const e = this.map.get(key);
    if (!e) return null;
    if (Date.now() > e.expiresAt) {
      this.map.delete(key);
      return null;
    }
    return e.value as T;
  }

  set<T = any>(key: string, value: T, ttlMs?: number): void {
    const ttl = typeof ttlMs === 'number' ? ttlMs : this.defaultTtl;
    this.map.set(key, { value, expiresAt: Date.now() + ttl });
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): void {
    this.map.delete(key);
  }

  /**
   * Elimina entradas cuya key contiene `prefix`.
   * Si se pasa `auth` sólo se eliminarán las entradas que además contengan el mismo sufijo `|auth:${auth}`.
   * Esto evita invalidar cache de otros usuarios.
   */
  invalidatePrefix(prefix: string, auth?: string): void {
    const authSuffix = typeof auth === 'string' && auth.length ? `|auth:${auth}` : undefined;
    for (const key of Array.from(this.map.keys())) {
      if (!key.includes(prefix)) continue;
      if (authSuffix && !key.endsWith(authSuffix)) continue;
      this.map.delete(key);
    }
  }

  clear(): void {
    this.map.clear();
  }
}
