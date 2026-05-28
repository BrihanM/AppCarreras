/**
 * @fileoverview Servicio de WebSocket para comunicación en tiempo real.
 * Gestiona la conexión con Socket.IO y distribuye eventos mediante Observables.
 *
 * @description
 * - Conecta automáticamente al montar la app si hay sesión activa.
 * - Expone métodos para escuchar y emitir eventos específicos.
 * - Desconecta limpiamente al cerrar sesión.
 *
 * @class WebSocketService
 */
import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';

import { environment } from '@environments/environment';
import { SocketEvent } from '@shared/enums/app.enums';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket!: Socket;
  private readonly destroy$ = new Subject<void>();

  /** true si la conexión WebSocket está activa. */
  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Establece conexión con el servidor WebSocket.
   * Se llama tras autenticación exitosa enviando el token JWT.
   *
   * @param token Token JWT del usuario autenticado.
   */
  connect(token: string): void {
    if (this.socket?.connected) return;

    this.socket = io(environment.wsUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on(SocketEvent.Connect, () => {
      console.info('[WS] Conectado al servidor');
    });

    this.socket.on(SocketEvent.Disconnect, (reason) => {
      console.warn('[WS] Desconectado:', reason);
    });
  }

  /**
   * Suscribe a un evento específico del socket y devuelve un Observable tipado.
   *
   * @template T Tipo del payload del evento.
   * @param event Nombre del evento a escuchar (usar SocketEvent enum).
   * @returns Observable que emite cada vez que se recibe el evento.
   */
  on<T>(event: SocketEvent | string): Observable<T> {
    return new Observable<T>((observer) => {
      this.socket?.on(event, (data: T) => observer.next(data));
      return () => this.socket?.off(event);
    }).pipe(takeUntil(this.destroy$));
  }

  /**
   * Emite un evento al servidor WebSocket.
   *
   * @param event Nombre del evento.
   * @param data Payload del evento.
   */
  emit<T>(event: string, data?: T): void {
    this.socket?.emit(event, data);
  }

  /**
   * Desconecta limpiamente el socket.
   * Llamar en logout o al destruir el servicio.
   */
  disconnect(): void {
    this.socket?.disconnect();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
