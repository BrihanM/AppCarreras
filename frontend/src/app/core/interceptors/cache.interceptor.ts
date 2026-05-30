import { HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CacheService } from '../services/cache.service';
import { CacheRulesService } from '../services/cache-rules.service';

/**
 * Interceptor que cachea respuestas GET con TTL.
 * La clave del cache incluye URL + params + Authorization header (si existe)
 */
export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cache = inject(CacheService);
  // GET -> intentar servir desde cache
  if (req.method === 'GET') {
    const auth = req.headers.get('Authorization') || '';
    const key = `${req.urlWithParams}|auth:${auth}`;
    const cached = cache.get<HttpResponse<any>>(key);
    if (cached) return of(cached.clone());

    return next(req).pipe(
      tap((event: any) => {
        if (event instanceof HttpResponse && event.status === 200) {
          cache.set(key, event.clone());
        }
      })
    );
  }

  // Mutating requests -> forward, then invalidate relevant cache on success
  const mutating = ['POST', 'PUT', 'PATCH', 'DELETE'];
  if (mutating.includes(req.method)) {
    const base = req.url.split('?')[0];
    const auth = req.headers.get('Authorization') || '';
    return next(req).pipe(
      tap((event: any) => {
        if (event instanceof HttpResponse && (event.status === 200 || event.status === 201 || event.status === 204)) {
          try {
            // invalidar sólo entradas pertenecientes al mismo Authorization
            cache.invalidatePrefix(base, auth);

            // Invalidate based on admin-defined rules (if any)
            try {
              const rulesSvc = inject(CacheRulesService);
              rulesSvc.getRules().then((rules) => {
                for (const r of rules || []) {
                  try {
                    // match by prefix or exact match
                    if (!r.mutating_endpoint) continue;
                    const me = r.mutating_endpoint.replace(/\s+$/g, '');
                    if (base === me || base.startsWith(me)) {
                      (r.invalidates || []).forEach((p) => cache.invalidatePrefix(p, auth));
                    }
                  } catch (e) {}
                }
              }).catch(()=>{});
            } catch (e) {}

            // Además invalidar rutas relacionadas si podemos inferir user ids
            const body = event.body || {};
            const candidateIds = new Set<string>();
            // campos comunes en request/response
            ['user_id','userId','id','challenger_id','challenged_id','owner_id','account_id'].forEach((k) => {
              const v = (body as any)[k] || (req as any).body?.[k];
              if (typeof v === 'string' && v.length) candidateIds.add(v);
            });
            // si hay un objeto user
            if ((body as any).user && (body as any).user.id) candidateIds.add((body as any).user.id);

            for (const uid of Array.from(candidateIds)) {
              // invalidar cualquier endpoint que incluya /users/:id para este auth
              cache.invalidatePrefix(`/api/users/${uid}`, auth);
              cache.invalidatePrefix(`/api/users/${uid}/vehicles`, auth);
              cache.invalidatePrefix(`/api/users/${uid}/challenges`, auth);
            }
          } catch (e) {}
        }
      })
    );
  }

  // Fallback: pass through
  return next(req);
};
