# StreetRaceX — WebSocket & Real-time

## Connection

WebSocket is initialized in `ShellComponent.ngOnInit()` after the user is authenticated:

```typescript
const token = this.storageService.get<string>(STORAGE_KEYS.ACCESS_TOKEN);
if (token) this.wsService.connect(token);
```

The JWT token is passed in the `auth` option of socket.io:

```typescript
io(wsUrl, { auth: { token } })
```

## Events

| Event | Payload | Handler |
|---|---|---|
| `notification:new` | `Notification` | `NotificationsFacade.initRealtimeNotifications()` |
| `challenge:received` | `Challenge` | Future: ChallengeFacade |
| `challenge:accepted` | `Challenge` | Future: ChallengeFacade |
| `challenge:completed` | `Challenge` | Future: ChallengeFacade |
| `rank:updated` | `{ userId, rank, points }` | Future: DashboardFacade |
| `online:user` | `{ userId, online }` | Future: MatchmakingFacade |

## Usage Pattern

```typescript
// In a Facade (implements OnDestroy)
private wsSub?: Subscription;

initRealtimeNotifications(): void {
  this.wsSub = this.wsService
    .on<Notification>(SocketEvent.NotificationNew)
    .subscribe((notification) => {
      this.notifications.update(list => [notification, ...list]);
      this.toastService.info(notification.message);
    });
}

ngOnDestroy(): void {
  this.wsSub?.unsubscribe();
}
```

## WebSocketService API

```typescript
connect(token: string): void
on<T>(event: string): Observable<T>
emit<T>(event: string, data: T): void
disconnect(): void
```
