import { Server } from 'socket.io';

let io: Server | null = null;

export function setIo(serverIo: Server) {
  io = serverIo;
}

export function getIo(): Server | null {
  return io;
}
