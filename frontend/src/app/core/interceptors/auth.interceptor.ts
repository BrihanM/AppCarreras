/**
 * @fileoverview Interceptor HTTP para inyección automática del token JWT.
 * Adjunta el Bearer token a todas las peticiones salientes a la API.
 *
 * @description
 * - Lee el token de localStorage mediante el StorageService.
 * - Si existe token, clona la request y añade el header Authorization.
 * - Maneja el error 401 redirigiendo al login automáticamente.
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError, from, concatMap } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS, APP_ROUTES } from '../constants/app.constants';
import { environment } from '@environments/environment';

/**
 * Interceptor funcional de autenticación JWT.
 * Se registra en app.config.ts mediante provideHttpClient(withInterceptors([authInterceptor])).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
  const isApiRequest = req.url.startsWith(environment.apiUrl) || req.url.startsWith('/api/');

  const authReq = token && isApiRequest
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!isApiRequest) {
        return throwError(() => error);
      }

      // If 401, try to rotate refresh token once (skip for auth endpoints)
      if (error.status === 401 && !req.url.includes('/auth/refresh') && !req.url.includes('/auth/login')) {
        // call refresh endpoint via fetch to include cookie (refreshToken) and avoid interceptor recursion
        const refreshUrl = `${environment.apiUrl}/auth/refresh`;
        return from(fetch(refreshUrl, { method: 'POST', credentials: 'include' }).then(async (r) => {
          if (!r.ok) throw new Error('Refresh failed');
          const body = await r.json();
          return body;
        })).pipe(
          concatMap((body: any) => {
            const newAccess = body?.accessToken || body?.access_token || body?.data?.accessToken;
            if (!newAccess) {
              // refresh failed
              storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
              storage.remove(STORAGE_KEYS.USER);
              router.navigate([APP_ROUTES.AUTH.LOGIN]);
              return throwError(() => error);
            }
            // persist new access token and retry original request
            storage.set(STORAGE_KEYS.ACCESS_TOKEN, newAccess);
            const retried = req.clone({ setHeaders: { Authorization: `Bearer ${newAccess}` } });
            return next(retried);
          })
        );
      }

      if (error.status === 401) {
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.USER);
        router.navigate([APP_ROUTES.AUTH.LOGIN]);
      }
      return throwError(() => error);
    })
  );
};
