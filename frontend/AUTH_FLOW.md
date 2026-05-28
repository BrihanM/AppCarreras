# StreetRaceX — Auth Flow

## Login

```
LoginPage → AuthFacade.login()
         → AuthService.login(credentials)
         → POST /auth/login
         → { data: { user, accessToken } }
         → StorageService.set(ACCESS_TOKEN, token)
         → StorageService.set(USER, user)
         → AuthService._currentUser.set(user)
         → Router.navigate(['/dashboard'])
```

## Register

```
RegisterPage → AuthFacade.register()
             → AuthService.register(payload)
             → POST /auth/register
             → same as login flow
```

## Logout

```
NavbarComponent → AuthService.logout()
               → POST /auth/logout (fire-and-forget)
               → StorageService.clear()
               → _currentUser.set(null)
               → Router.navigate(['/auth/login'])
```

## Guards

| Guard | Condition | Redirect |
|---|---|---|
| `authGuard` | `!isAuthenticated()` → redirect | `/auth/login` |
| `publicGuard` | `isAuthenticated()` → redirect | `/dashboard` |
| `adminGuard` | `!isAdmin()` → redirect | `/dashboard` |

## Token Persistence

- Token stored in `localStorage` under key `srx_access_token`
- `AuthInterceptor` attaches `Authorization: Bearer {token}` on every request
- 401 responses → interceptor clears storage and redirects to login

## Signals

```typescript
authService.currentUser()       // User | null
authService.isAuthenticated()   // boolean (computed)
authService.isAdmin()           // boolean (computed)
```
