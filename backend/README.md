# Backend - AppCarreras

Resumen y guía rápida para el backend de AppCarreras.

Contenido
- `src/` - código TypeScript del backend (microservicios en hexagonal: auth, users, vehicles, challenges, notifications, categories).
- `.postman/` - colecciones Postman para pruebas.

Requisitos
- Node.js 18+ y npm
- PostgreSQL (configurar `DATABASE_URL` en `.env`)

Instalación

```bash
cd backend
npm install
```

Variables de entorno importantes (.env)
- `DATABASE_URL` - conexión a Postgres
- `PORT` - puerto (default 4000)
- `CLIENT_URL` - URL del frontend (para CORS)
- `JWT_SECRET` - secreto para firmar JWT
- `JWT_EXPIRES_IN` - expiración del token (ej. `7d`)

Migraciones

Las migraciones SQL están en `src/modules/*/infrastructure/migrations/`.
Para ejecutarlas:

```bash
npm run migrate
```

Arrancar en desarrollo

```bash
npm run dev
```

Autenticación

- El `login` devuelve un JWT y también establece una cookie `token` HttpOnly.
- El backend acepta autenticación por `Authorization: Bearer <token>` o por cookie `token`.

WebSocket (Socket.io)

- Socket.io está habilitado y registrado globalmente. Los sockets autenticados se unen a la sala `user:<userId>`.
- Métodos de autenticación para sockets:
  - Enviar header `Authorization: Bearer <token>` al conectar (ej. con `extraHeaders`).
  - O, si el cliente está en el mismo dominio, el navegador enviará la cookie HttpOnly automáticamente.

Ejemplo cliente (socket.io-client):

```js
import { io } from 'socket.io-client';

// usando token en header
const socket = io('http://localhost:4000', {
  extraHeaders: { Authorization: 'Bearer <token>' }
});

socket.on('connect', () => console.log('connected'));
socket.on('notification', (n) => console.log('notif', n));
```

Eventos emitidos (resumen)
- `notification` - enviada a `user:<id>` al crear una notificación.
- `challenge:created|challenge:updated|challenge:completed` - enviadas a usuarios implicados.
- `vehicle:activated|vehicle:deleted` - enviadas al propietario.
- `user:*`, `account:*`, `category:*` - emisiones globales para CRUD según módulo.

Pruebas y Postman

- Las colecciones Postman están en `.postman/`. Ejecutar la colección `Auth` primero para obtener `token`.
- Las colecciones configuran variables de entorno `{{baseUrl}}`, `{{token}}`, `{{userId}}`.

Notas de arquitectura

- Arquitectura hexagonal por módulo: `domain`, `application`, `infrastructure`.
- Servicios (domain) implementan reglas de negocio y usan adaptadores de `infrastructure`.
- Para invariantes fuertes (ej. único vehículo activo), se aplican reglas en el service; se puede reforzar con índices/constraints en la BD.

Siguientes pasos sugeridos
- Documentar endpoints en OpenAPI o ampliar README con ejemplos por endpoint.
- Añadir tests de integración que verifiquen emisiones WebSocket.

---
Si quieres, ahora empiezo a añadir JSDoc en español al archivo `src/index.ts` (primer archivo). ¿Procedo? 
