/**
 * @fileoverview Modelos de dominio del usuario / piloto.
 */
import { UserRole, UserStatus } from '../enums/app.enums';

/** Modelo completo del usuario devuelto por el backend. */
export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  firstName?: string;
  lastName?: string;
  bio?: string;
  city?: string;
  avatarUrl?: string;
  rank: string;
  points: number;
  wins: number;
  losses: number;
  /** Marca temporalmente si el piloto está en un reto (optimistic UI). */
  inChallenge?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload de credenciales para login. */
export interface LoginCredentials {
  email: string;
  password: string;
}

/** Payload para registro de usuario. */
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

/** Payload para crear el recurso `user`/empleado vinculado a una cuenta. */
export interface CreateUserPayload {
  name: string;
  local_zone?: string | null;
  city_area?: string | null;
  state_zone?: string | null;
  country_zone?: string | null;
  rank?: string | null;
  category_id?: string | null;
  victories?: number;
  defeats?: number;
  consecutive_challenges?: number;
  state?: string;
  account_id?: string; // se añade tras crear la cuenta
}

/** Payload combinado usado por la UI de registro que contiene credenciales y datos de empleado. */
export interface RegisterWithUserPayload {
  // datos para /auth/register
  username: string;
  email: string;
  password: string;

  // datos para /api/users
  user: CreateUserPayload;
}

/** Tokens JWT devueltos por el backend. */
export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

/** Respuesta combinada de autenticación (usuario + tokens). */
export interface AuthResponse {
  user: User;
  accessToken: string;
}

/** Payload para actualizar el perfil del usuario autenticado. */
/** Payload to update the authenticated account (username/email/password/photo) */
export interface UpdateAccountPayload {
  username?: string;
  email?: string;
  password?: string;
  avatarUrl?: string;
}

/** Payload para actualizar el perfil del usuario autenticado. Incluye opcionalmente campos de cuenta. */
export interface UpdateProfilePayload extends UpdateAccountPayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  city?: string;
  avatarUrl?: string;
}
