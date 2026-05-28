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
  rank: number;
  points: number;
  wins: number;
  losses: number;
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
export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  bio?: string;
  city?: string;
  avatarUrl?: string;
}
