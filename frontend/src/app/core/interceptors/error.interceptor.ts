/**
 * @fileoverview Interceptor HTTP para manejo global de errores de red.
 * Transforma errores HTTP en mensajes amigables para el usuario.
 *
 * @description
 * - Captura errores de red y HTTP.
 * - Normaliza el mensaje de error para su consumo en los componentes.
 * - Registra errores en consola en modo desarrollo.
 */
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { environment } from '@environments/environment';

/**
 * Interceptor funcional de manejo de errores HTTP globales.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (!environment.production) {
        console.error(`[HTTP Error] ${error.status} - ${req.url}`, error);
      }

      let message = 'Ha ocurrido un error inesperado.';

      if (error.status === 0) {
        message = 'Sin conexión al servidor. Verifica tu red.';
      } else if (error.error?.error) {
        // backend sometimes returns { error: 'message' }
        message = error.error.error;
      } else if (error.error?.message) {
        message = error.error.message;
      } else if (error.status === 403) {
        message = 'No tienes permisos para realizar esta acción.';
      } else if (error.status === 404) {
        message = 'Recurso no encontrado.';
      } else if (error.status >= 500) {
        message = 'Error interno del servidor. Intenta más tarde.';
      }

      return throwError(() => ({ ...error, friendlyMessage: message }));
    })
  );
};
