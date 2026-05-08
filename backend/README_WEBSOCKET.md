# WebSocket (Socket.io) — Backend AppCarreras

Resumen
- El proyecto usa Socket.io para comunicaciones en tiempo real.
- La autenticación del socket comparte la misma fuente de verdad que la API HTTP: JWT (`token`) enviado por cookie HttpOnly o por header `Authorization`.
- Hay un módulo central `src/socket.ts` que exporta `setIo` y `getIo` para evitar importaciones circulares.

Handshake y autenticación
- Al recibir un intento de conexión Socket.io, el servidor intenta obtener el token en este orden:
  1. Cookie `token` (si la petición incluye cookies). El middleware `parseCookies` y la lógica del handshake extraen estas cookies.
  2. Header `Authorization: Bearer <token>` enviado durante el handshake.
- El token se verifica con el mismo `JWT_SECRET` que la API HTTP.
- Si la verificación es exitosa, el socket se asocia al userId (por ejemplo `sub` del JWT) y el socket se une a una sala `user:<id>`.

Ficheros relevantes
- Módulo socket central: [src/socket.ts](src/socket.ts)
- Autenticación por cookie/header: [src/middleware/cookieAuth.ts](src/middleware/cookieAuth.ts)
- Lógica de handshake en `src/index.ts` (inicialización de Socket.io y verificación): [src/index.ts](src/index.ts)

Rooms y convenciones
- Convención de salas por usuario: `user:<userId>` — se usa para enviar notificaciones o eventos dirigidos a un usuario concreto.
- También se pueden usar salas por recurso, p.ej. `vehicle:<vehicleId>` o `challenge:<challengeId>` según necesidad.

Emisión de eventos desde servicios
- Los servicios del dominio emiten eventos hacia sockets usando el `io` global obtenido con `getIo()`.
- Ejemplo típico dentro de un service:

```ts
import { getIo } from '../../socket';

const io = getIo();
io.to(`user:${userId}`).emit('notification:created', { id, title, body });
```

Eventos estándar (ejemplos implementados)
- `notification:created` — notificación nueva para un usuario.
- `vehicle:created` / `vehicle:activated` / `vehicle:deleted` — ciclos de vida de vehículos.
- `challenge:created` / `challenge:accepted` / `challenge:completed` — eventos del flujo de challenges.

Conexión desde cliente
- Si el login usa cookie HttpOnly y el cliente está en el mismo dominio (o CORS configura `credentials: 'include'`), la cookie se enviará automáticamente al conectar Socket.io:

```js
// cliente web (usa cookie enviada por login)
import { io } from 'socket.io-client';
const socket = io('http://localhost:3000', { withCredentials: true });

socket.on('connect', () => {
  console.log('connected');
});
```

- Alternativamente, enviar token en `auth` o `extraHeaders` si no se usan cookies:

```js
// enviar token explícito
const token = 'eyJ...';
const socket = io('http://localhost:3000', { auth: { token } });
```

Notas sobre seguridad y escalado
- Balanceadores y proxys: asegurarse de que las cookies y headers lleguen al servidor.
- Escalado horizontal: para emitir a sockets en múltiples instancias usar adapter de Socket.io (p.ej. Redis adapter) y compartir el `io` entre instancias.
- Validación de eventos: siempre validar payloads recibidos desde clientes con los mismos esquemas (Zod) usados por HTTP.

Depuración
- Para capturar emisiones y rooms en servidor, añadir logs temporales en los servicios o usar:

```ts
const io = getIo();
console.log('rooms:', Array.from(io.sockets.adapter.rooms.keys()));
```

Comandos útiles

```bash
# Ejecutar servidor local
npm run dev

# Verificar tipos TS
npx tsc --noEmit
```

Archivo(s) clave en el proyecto
- [src/socket.ts](src/socket.ts)
- [src/index.ts](src/index.ts)
- [src/middleware/cookieAuth.ts](src/middleware/cookieAuth.ts)
- Servicios que emiten eventos: [src/modules/notifications](src/modules/notifications), [src/modules/vehicles](src/modules/vehicles), [src/modules/challenges](src/modules/challenges)
