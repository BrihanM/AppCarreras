# StreetRaceX — Frontend Architecture

## Stack

| Capa | Tecnología |
|---|---|
| Framework | Angular 21.2 (Standalone Components) |
| Language | TypeScript (strict mode) |
| State | Angular Signals |
| Async | RxJS 7 |
| Real-time | socket.io-client (WebSocket) |
| HTTP | HttpClient + functional interceptors |
| Styling | SCSS (BEM) + CSS custom properties |
| Build | esbuild (Angular CLI) |
| Testing | Jest |

## Folder Structure

```
src/app/
├── core/                    # Singleton services, guards, interceptors
│   ├── constants/           # APP_ROUTES, STORAGE_KEYS, PAGINATION_DEFAULTS
│   ├── guards/              # auth.guard, admin.guard, public.guard
│   ├── interceptors/        # auth.interceptor, error.interceptor
│   ├── services/            # AuthService, StorageService, ToastService
│   └── websocket/           # WebSocketService (socket.io wrapper)
├── shared/                  # Reusable UI & models
│   ├── components/ui/       # ToastContainer, Skeleton, EmptyState
│   ├── enums/               # app.enums.ts (UserRole, SocketEvent, etc.)
│   └── interfaces/          # All TypeScript interfaces
├── layout/                  # App shell structure
│   ├── components/          # Navbar, Sidebar
│   └── pages/               # ShellComponent (router-outlet wrapper)
└── features/                # Feature modules (lazy-loaded)
    ├── auth/
    ├── dashboard/
    ├── profile/
    ├── vehicles/
    ├── matchmaking/
    ├── challenges/
    ├── notifications/
    └── admin/
```

## Architecture Principles

### Facade Pattern
Components **never** inject services directly. They only interact with Facades.

```
Component → Facade → Service → HttpClient / WebSocket
```

### Signals-first State
All state is held in Angular Signals. No NgRx, no BehaviorSubject for UI state.

```typescript
// In Facade
readonly isLoading = signal(false);
readonly items = signal<Item[]>([]);
readonly unreadCount = computed(() => this.items().filter(i => !i.isRead).length);
```

### Lazy Loading
Every feature is lazy-loaded via `loadChildren` or `loadComponent`.

### Optimistic UI
Mutations that are likely to succeed update the UI immediately, then rollback on error.

## Route Tree

```
/auth/login           (public, publicGuard)
/auth/register        (public, publicGuard)
/                     → ShellComponent (authGuard)
├── /dashboard
├── /profile
├── /vehicles
├── /matchmaking
├── /challenges
├── /notifications
└── /admin            (adminGuard)
    ├── /admin/dashboard
    ├── /admin/users
    └── /admin/categories
```

## Path Aliases

| Alias | Maps to |
|---|---|
| `@core/*` | `src/app/core/*` |
| `@shared/*` | `src/app/shared/*` |
| `@layout/*` | `src/app/layout/*` |
| `@features/*` | `src/app/features/*` |
| `@environments/*` | `src/environments/*` |
