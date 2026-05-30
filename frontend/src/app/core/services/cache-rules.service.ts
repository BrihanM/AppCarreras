import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpBackend } from '@angular/common/http';
import { environment } from '@environments/environment';

/**
 * Servicio para obtener reglas de invalidación definidas por admin.
 * Usa HttpClient creado con HttpBackend para evitar ciclos de interceptor.
 */
@Injectable({ providedIn: 'root' })
export class CacheRulesService {
  private readonly http = new HttpClient(inject(HttpBackend));
  private rules: Array<{ mutating_endpoint: string; invalidates: string[] }> = [];
  private lastFetch = 0;
  private readonly ttl = 60 * 1000; // 60s cache for rules

  async getRules(): Promise<Array<{ mutating_endpoint: string; invalidates: string[] }>> {
    const now = Date.now();
    if (this.rules.length && (now - this.lastFetch) < this.ttl) return this.rules;
    try {
      const res: any = await this.http.get(`${environment.apiUrl}/admin/cache-rules`).toPromise();
      const data = res?.data || [];
      this.rules = (data || []).map((r: any) => ({ mutating_endpoint: r.mutating_endpoint, invalidates: Array.isArray(r.invalidates) ? r.invalidates : [] }));
      this.lastFetch = Date.now();
      return this.rules;
    } catch (e) {
      // On error, fallback to empty rules
      this.rules = [];
      this.lastFetch = Date.now();
      return this.rules;
    }
  }

  /** Force reload rules immediately */
  invalidateCache(): void {
    this.rules = [];
    this.lastFetch = 0;
  }
}
