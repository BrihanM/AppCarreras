import { Server } from 'socket.io';

/**
 * Módulo central para exponer la instancia de Socket.io a otros módulos
 * evitando importaciones cíclicas.
 *
 * Exporta dos utilidades:
 * - `setIo(serverIo: Server)`: registra la instancia creada en `src/index.ts`.
 * - `getIo(): Server | null`: devuelve la instancia registrada o `null` si
 *   aún no se ha registrado.
 *
 * Uso típico:
 * ```ts
 * // en src/index.ts
 * import { setIo } from './socket';
 * setIo(io);
 *
 * // en un service
 * import { getIo } from '../socket';
 * const io = getIo(); if (io) io.emit('event', payload);
 * ```
 */
let io: Server | null = null;

export function setIo(serverIo: Server) {
  io = serverIo;
}

export function getIo(): Server | null {
  return io;
}
