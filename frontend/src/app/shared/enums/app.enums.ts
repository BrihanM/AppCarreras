/**
 * @fileoverview Enumeraciones de roles y estados del usuario.
 */

/** Roles disponibles en la plataforma. */
export enum UserRole {
  Admin = 'admin',
  Pilot = 'pilot',
}

/** Estados posibles de una cuenta de usuario. */
export enum UserStatus {
  Active = 'active',
  Suspended = 'suspended',
  Pending = 'pending',
}

/** Estados de un reto entre pilotos. */
export enum ChallengeStatus {
  Pending = 'pending',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

/** Tipos de notificación del sistema. */
export enum NotificationType {
  ChallengeReceived = 'challenge_received',
  ChallengeAccepted = 'challenge_accepted',
  ChallengeRejected = 'challenge_rejected',
  ChallengeCompleted = 'challenge_completed',
  RankUpdated = 'rank_updated',
  SystemMessage = 'system_message',
}

/** Eventos de WebSocket manejados por la plataforma. */
export enum SocketEvent {
  ChallengeReceived = 'challenge:received',
  ChallengeAccepted = 'challenge:accepted',
  ChallengeCompleted = 'challenge:completed',
  NotificationNew = 'notification:new',
  RankUpdated = 'rank:updated',
  UserOnline = 'online:user',
  Connect = 'connect',
  Disconnect = 'disconnect',
}
