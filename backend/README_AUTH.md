# Autenticación — Backend AppCarreras

Resumen breve
- El backend usa un esquema seguro de Access + Refresh tokens basado en JWT.
- Access token: token corto (15–30 minutos) usado para llamadas API (en header `Authorization` o cookie `accessToken`).
- Refresh token: token de larga duración (7 días) almacenado únicamente como cookie HttpOnly `refreshToken` y también persistido en la BD como hash para permitir rotación y revocación.

Flujo principal
1. El cliente envía credenciales a `POST /api/auth/login`.
2. Si las credenciales son válidas el servidor:
   - Genera un `accessToken` (corto) y lo devuelve en el body: `{ accessToken }`.
   - Genera un `refreshToken` (secreto) y lo persiste en la BD como hash; además lo establece en la cookie HttpOnly `refreshToken` con `Max-Age=7d`.
3. Para renovar sesión el cliente llama `POST /api/auth/refresh` (la cookie `refreshToken` se envía automáticamente si se usan cookies). El servidor valida el hash, rota el refresh token (crea uno nuevo y marca/revoca el anterior) y devuelve un nuevo `accessToken` además de reemplazar la cookie `refreshToken`.
4. Logout: `POST /api/auth/logout` revoca el refresh token en la BD y borra la cookie `refreshToken` en el cliente.

Puntos importantes de seguridad
- Los refresh tokens se almacenan hasheados en la BD (ver: migration `src/modules/auth/infrastructure/migrations/000_create_refresh_tokens.sql` y `RefreshTokenRepositoryPg`) para minimizar riesgo en caso de leak.
- La rotación de refresh tokens reduce la ventana de ataque: cada uso consume/reescribe el token y el antiguo se marca como reemplazado.
- En caso de detección de reuse (uso de un refresh token ya revocado) el sistema revoca todos los tokens del usuario para mitigar compromiso.

Endpoints relevantes
- `POST /api/auth/login` — recibe credenciales, retorna `{ accessToken }` y establece cookie `refreshToken` (HttpOnly, Secure en producción).
- `POST /api/auth/refresh` — rota refresh token y retorna nuevo `{ accessToken }`; reemplaza cookie `refreshToken`.
- `POST /api/auth/logout` — revoca refresh token y borra la cookie `refreshToken`.

Cookies y headers
- Cookie de refresh: `refreshToken` (HttpOnly, Max-Age=7d).
- Cookie opcional de access: `accessToken` (si se usa estrategia de cookies); por defecto el `accessToken` se devuelve en el body y el cliente debe enviarlo en `Authorization: Bearer <accessToken>`.
- El middleware `cookieAuth` extrae el token de (prioridad):
  1. Header `Authorization: Bearer <token>`
  2. Cookie `accessToken` (soporte para estrategia por cookies si el cliente la usa)
  3. Cookie legacy `token` (compatibilidad)
  4. Header `x-cookie` (fallback que contiene la cadena cookie)

Middlewares y archivos clave
- `src/middleware/parseCookies.ts` — parsea `Cookie` y expone `req.cookies`.
- `src/middleware/cookieAuth.ts` — extrae token desde header/cookie/x-cookie y popula `req.user` si válido.
- `src/modules/auth/application/middleware/authMiddleware.ts` — `requireAuth` para endpoints que obligan autenticación.
- `src/modules/auth/application/controllers/authController.ts` — implementa `login`, `refresh`, `logout`.
- `src/modules/auth/infrastructure/adapters/pg/RefreshTokenRepositoryPg.ts` — persistencia de refresh tokens (usa hash).
- Migración de refresh tokens: `src/modules/auth/infrastructure/migrations/000_create_refresh_tokens.sql`.

Uso desde clientes
- Navegador (recomendado):
  - Hacer `POST /api/auth/login` con `credentials: 'include'` si confías en cookies.
  - Guardar `accessToken` en memoria (no en localStorage) y usar `Authorization: Bearer <accessToken>` en llamadas API; cuando caduque, llamar a `/api/auth/refresh` para obtener nuevo acceso.

Ejemplo (fetch):

```js
// login -> obtiene accessToken en body y cookie refreshToken se establece automáticamente
const res = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});
const { accessToken } = await res.json();

// usar accessToken en subsequent requests
await fetch('http://localhost:3000/api/users/me', {
  headers: { Authorization: `Bearer ${accessToken}` },
  credentials: 'include'
});

// refresh
await fetch('http://localhost:3000/api/auth/refresh', { method: 'POST', credentials: 'include' });
```

- Postman / herramientas:
  - La colección `Auth` incluye tests que capturan `accessToken` y manejan la cookie `refreshToken` (ver `.postman/Auth.postman_collection.json`).
  - Para entornos sin cookies capture el `accessToken` del body del `login` y úselo en `Authorization: Bearer {{accessToken}}`.

Tests y documentación interna
- Los tests unitarios del módulo de auth están en `src/modules/auth/__tests__/AuthService.spec.ts` y están documentados con JSDoc describiendo Arrange/Act/Assert en cada caso.
- Se añadieron tests unitarios y documentación JSDoc para los demás módulos: `users`, `vehicles`, `challenges`, `notifications`, `categories`.

Recomendaciones de despliegue
- En producción use HTTPS (`Secure` cookies), `SameSite` apropiado y configure el dominio/path de la cookie.
- Considere almacenar un blacklist/denylist en Redis si necesita invalidación inmediata a gran escala.

Comandos útiles

```bash
# Ejecutar chequeo de TS
npx tsc --noEmit

# Ejecutar migraciones (configurar DB primero)
npm run migrate

# Ejecutar tests
npm test

# Iniciar servidor en desarrollo
npm run dev
```
