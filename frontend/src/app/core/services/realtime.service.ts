import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketService } from '@core/websocket/websocket.service';
import { CacheService } from './cache.service';
import { StorageService } from './storage.service';
import { STORAGE_KEYS } from '../constants/app.constants';

/**
 * Servicio central de tiempo real.
 * - Escucha eventos del socket y realiza invalidaciones de cache seguras por usuario.
 * - Emite eventos locales para que las fachadas actualicen sus señales.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly events = new Subject<{ type: string; payload: any }>();
  readonly events$ = this.events.asObservable();
  private initialized = false;

  constructor(
    private readonly ws: WebSocketService,
    private readonly cache: CacheService,
    private readonly storage: StorageService
  ) {}

  /** Inicializa listeners en el socket; llamar tras conectar WebSocket. */
  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    // helper to get auth string suffix used in cache keys
    const token = this.storage.get<string>(STORAGE_KEYS.ACCESS_TOKEN) || '';
    const auth = token ? `Bearer ${token}` : '';

    const listen = (event: string) => {
      this.ws.on<any>(event).subscribe((payload) => this.handleEvent(event, payload, auth));
    };

    // user events
    ['user:created', 'user:updated', 'user:deleted'].forEach(listen);
    // account events
    ['account:created', 'account:updated', 'account:deleted'].forEach(listen);
    // challenges
    ['challenge:created', 'challenge:updated', 'challenge:completed'].forEach(listen);
    // vehicles
    ['vehicle:activated', 'vehicle:updated', 'vehicle:deleted'].forEach(listen);
    // notifications
    ['notification:new', 'notification:read', 'notification:all-read'].forEach(listen);
    // rank updates
    ['rank:updated'].forEach(listen);
    // categories etc
    ['category:created','category:updated','category:deleted'].forEach(listen);
  }

  private handleEvent(event: string, payload: any, auth: string) {
    try {
      // Emit local event for facades
      this.events.next({ type: event, payload });

      // Invalidate cache per-event safely (same auth)
      switch (event) {
        case 'user:created':
        case 'user:updated':
        case 'user:deleted':
          this.cache.invalidatePrefix('/api/users', auth);
          if (payload?.id) this.cache.invalidatePrefix(`/api/users/${payload.id}`, auth);
          break;
        case 'account:created':
        case 'account:updated':
        case 'account:deleted':
          this.cache.invalidatePrefix('/api/users/me', auth);
          this.cache.invalidatePrefix('/api/accounts', auth);
          break;
        case 'challenge:created':
        case 'challenge:updated':
        case 'challenge:completed':
          this.cache.invalidatePrefix('/api/challenges', auth);
          if (payload?.challenger_id) this.cache.invalidatePrefix(`/api/users/${payload.challenger_id}/challenges`, auth);
          if (payload?.challenged_id) this.cache.invalidatePrefix(`/api/users/${payload.challenged_id}/challenges`, auth);
          break;
        case 'vehicle:activated':
        case 'vehicle:updated':
        case 'vehicle:deleted':
          this.cache.invalidatePrefix('/api/vehicles', auth);
          if (payload?.user_id) this.cache.invalidatePrefix(`/api/users/${payload.user_id}/vehicles`, auth);
          break;
        case 'notification:new':
        case 'notification:read':
        case 'notification:all-read':
          this.cache.invalidatePrefix('/api/notifications', auth);
          break;
        case 'rank:updated':
          if (payload?.userId) this.cache.invalidatePrefix(`/api/users/${payload.userId}`, auth);
          break;
        case 'category:created':
        case 'category:updated':
        case 'category:deleted':
          this.cache.invalidatePrefix('/api/categories', auth);
          break;
        default:
          // generic invalidation for known base paths
          if (payload?.id) {
            this.cache.invalidatePrefix(`/api/${event.split(':')[0]}s`, auth);
          }
      }
    } catch (e) {
      console.warn('[Realtime] error handling event', event, e);
    }
  }
}
