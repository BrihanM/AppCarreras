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
import { catchError, throwError } from 'rxjs';
import { StorageService } from '../services/storage.service';
import { STORAGE_KEYS, APP_ROUTES } from '../constants/app.constants';

/**
 * Interceptor funcional de autenticación JWT.
 * Se registra en app.config.ts mediante provideHttpClient(withInterceptors([authInterceptor])).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  const token = storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN);

  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
        storage.remove(STORAGE_KEYS.USER);
        router.navigate([APP_ROUTES.AUTH.LOGIN]);
      }
      return throwError(() => error);
    })
  );
};
