# Autenticación — Backend AppCarreras

Resumen breve
- Este backend usa JWT para autenticación.
- El JWT se firma con `process.env.JWT_SECRET` y puede transmitirse de dos formas:
  - Cookie HttpOnly llamada `token` (recomendada para clientes web).
  - Header `Authorization: Bearer <token>` (útil para APIs y herramientas como Postman).

Flujo de login
1. El cliente envía credenciales a `POST /api/auth/login`.
2. El servidor valida credenciales y genera un JWT con `sub` = userId y otros claims (por ejemplo `username`).
3. El endpoint de `login` envía el token de dos maneras:
   - Establece la cookie HttpOnly `token` en la respuesta (Set-Cookie) con opciones de seguridad.
   - Opcionalmente devuelve `{ token }` en el body (según configuración).

Cookies y seguridad
- Cookie: `token` (HttpOnly)
- Recomendaciones de configuración en producción:
  - `HttpOnly: true` (impide acceso desde JavaScript)
  - `Secure: true` (solo HTTPS)
  - `SameSite: 'lax'` o `'strict'` según necesidades
  - `domain`/`path` específicos según despliegue

Middlewares relevantes
- `src/middleware/parseCookies.ts` — parsea la cabecera `Cookie` y expone `req.cookies`.
  - Uso: registrar como middleware global antes de `cookieAuth`.
  - Ruta: [src/middleware/parseCookies.ts](src/middleware/parseCookies.ts)

- `src/middleware/cookieAuth.ts` — extracción y verificación del token desde:
  - Header `Authorization: Bearer <token>`
  - Cookie `token` (populada por `parseCookies`)
  - Header personalizado `x-cookie` (fallback para clientes que envíen la cadena cookie)
  - Proporciona `cookieAuth(optional = true)` que puede permitir requests no autenticadas si `optional`.
  - Ruta: [src/middleware/cookieAuth.ts](src/middleware/cookieAuth.ts)

- `src/modules/auth/application/middleware/authMiddleware.ts` — `requireAuth` que exige header `Authorization` (Bearer) y falla con 401 en caso de ausencia o token inválido.
  - Ruta: [src/modules/auth/application/middleware/authMiddleware.ts](src/modules/auth/application/middleware/authMiddleware.ts)

Uso desde clientes
- Navegador web (recomendado):
  1. Hacer `POST /api/auth/login` — el navegador recibirá la cookie `Set-Cookie` y la almacenará si la respuesta y el origen son permitidos por CORS.
  2. Subsecuentes peticiones fetch/fetch API incluirán la cookie si se usan `credentials: 'include'`.

- Postman / herramientas: Capture el header `Set-Cookie` del login y guárdalo en la variable de entorno `tokenCookie` o extrae manualmente el JWT y colócalo en `{{token}}` para `Authorization: Bearer {{token}}`.

Ejemplo de uso en fetch (cliente web):

```js
// login
await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// luego peticiones autenticadas (cookie enviada automáticamente)
await fetch('http://localhost:3000/api/users/me', {
  credentials: 'include'
});
```

Ejemplo con Authorization header (Postman o cliente JS que prefiera token explícito):

```
Authorization: Bearer <token>
```

Consideraciones adicionales
- Las APIs públicas/externas pueden preferir `Authorization` header.
- Las cookies HttpOnly protegen contra XSS, pero hay que considerar CSRF: usar SameSite, tokens CSRF o diseño de endpoints para mitigar.
- El middleware `cookieAuth` se diseñó para ser tolerante (`optional`) en rutas públicas; para endpoints que requieren autenticación use `requireAuth` o `cookieAuth(false)`.

Archivo(s) clave en el proyecto
- [src/middleware/parseCookies.ts](src/middleware/parseCookies.ts)
- [src/middleware/cookieAuth.ts](src/middleware/cookieAuth.ts)
- [src/modules/auth/application/controllers/authController.ts](src/modules/auth/application/controllers/authController.ts)

Comandos útiles

```bash
# Ejecutar chequeo de TS
npx tsc --noEmit

# Ejecutar migraciones (configurar DB primero)
npm run migrate

# Iniciar servidor en desarrollo
npm run dev
```
