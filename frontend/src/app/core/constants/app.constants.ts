/**
 * @fileoverview Constantes globales de la aplicación.
 * Centraliza valores estáticos que no deben estar hardcodeados en el código.
 */

/** Claves usadas en localStorage/sessionStorage. */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'srx_access_token',
  USER: 'srx_user',
  THEME: 'srx_theme',
} as const;

/** Rutas de navegación de la aplicación. */
export const APP_ROUTES = {
  HOME: '/',
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  DASHBOARD: '/dashboard',
  PROFILE: '/profile',
  VEHICLES: '/vehicles',
  MATCHMAKING: '/matchmaking',
  CHALLENGES: '/challenges',
  NOTIFICATIONS: '/notifications',
  ADMIN: {
    ROOT: '/admin',
    USERS: '/admin/users',
    CATEGORIES: '/admin/categories',
    DASHBOARD: '/admin/dashboard',
  },
} as const;

/** Parámetros por defecto para paginación. */
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
} as const;

/** Tiempo en ms para debounce en búsquedas. */
export const DEBOUNCE_TIME = 300;
