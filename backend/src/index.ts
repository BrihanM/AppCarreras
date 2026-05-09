import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import http from 'http';
import cors from 'cors';
import parseCookies from './middleware/parseCookies';
import cookieAuth from './middleware/cookieAuth';
import { Server } from 'socket.io';
import { setIo } from './socket';
import { connectDB } from './config/db';
import authRoutes from './modules/auth/application/routes';
import usersRoutes from './modules/users/application/routes';
import vehiclesRoutes from './modules/vehicles/application/routes';
import challengesRoutes from './modules/challenges/application/routes';
import notificationsRoutes from './modules/notifications/application/routes';
import categoriesRoutes from './modules/categories/application/routes';


/**
 * @fileoverview Punto de entrada del backend AppCarreras.
 *
 * - Configura Express y middlewares principales (CORS, body parsers, cookies).
 * - Registra rutas de los módulos (auth, users, vehicles, challenges, notifications, categories).
 * - Inicializa Socket.io y expone el objeto `io` para que los servicios emitan eventos.
 *
 * Comentarios en español (JSDoc) documentan responsabilidades y puntos de extensión.
 */

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// register io globally for modules to use
setIo(io);

/**
 * Middlewares principales
 * - CORS con `credentials: true` para permitir cookies HttpOnly desde el cliente.
 * - `express.json()` y `express.urlencoded()` para parsear bodies.
 * - `parseCookies` popula `req.cookies` y `cookieAuth(true)` intenta autenticar
 *   (si hay token) para dejar `req.user` disponible.
 */
// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(parseCookies);
// Adjuntar autenticación opcional desde cookie o encabezado de autorización
app.use(cookieAuth(true));

// Aplicar la autenticación a todas las rutas /api excepto al módulo de autenticación (inicio de sesión/actualización/cierre de sesión).
app.use('/api', (req, res, next) => {
  // permitir acceso no autenticado a los endpoints de autenticación (/api/auth/*)
  if (req.path && req.path.startsWith('/auth')) return next();
  // permitir crear cuentas y usuarios sin autenticación
  if (req.method === 'POST' && (req.path === '/accounts' || req.path === '/users')) return next();
  // permitir si cookieAuth pobló req.user
  if ((req as any).user) return next();
  return res.status(401).json({ error: 'Unauthorized' });
});

// Rutas
/**
 * Healthcheck
 * @route GET /health
 * @returns {{status: string}} Estado simple para monitorización.
 */
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// API routes
app.use('/api', authRoutes);
app.use('/api', usersRoutes);
app.use('/api', vehiclesRoutes);
app.use('/api', challengesRoutes);
app.use('/api', notificationsRoutes);
app.use('/api', categoriesRoutes);

// Socket.io
/**
 * Autenticación para Socket.io
 * - Intenta extraer JWT desde `Authorization` o desde la cookie `token`.
 * - Si verifica correctamente, adjunta `socket.data.user = { id, username }`.
 * - No bloquea la conexión si no hay token (modo opcional). Cambiar para forzar auth.
 */
io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie as string | undefined;
    const authHeader = socket.handshake.headers.authorization as string | undefined;
    const tokenFromAuth = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    let token: string | null = tokenFromAuth;
    if (!token && cookieHeader) {
      const parts = cookieHeader.split(';').map(p => p.trim());
      const t = parts.find(p => p.startsWith('token='));
      if (t) token = decodeURIComponent(t.split('=')[1]);
    }
    if (token) {
      const jwt = require('jsonwebtoken');
      const secretLocal = process.env.JWT_SECRET || 'changeme';
      const payload = jwt.verify(token, secretLocal as any);
      (socket as any).data.user = { id: (payload as any).sub, username: (payload as any).username };
    }
    return next();
  } catch (err) {
    return next();
  }
});

/**
 * Manejo de conexión de sockets.
 * - Si el socket quedó autenticado durante el `io.use`, se une a la sala `user:<id>`.
 * - Aquí es un buen punto para registrar otros listeners específicos del socket.
 */
io.on('connection', (socket) => {
  const user = (socket as any).data?.user;
  console.log(`Client connected: ${socket.id}`, user ? 'user=' + JSON.stringify(user) : 'anonymous');
  if (user && user.id) {
    socket.join(`user:${user.id}`);
    console.log(`Client joined room: user:${user.id}`);
  }

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;

// Connectar a la base de datos y iniciar el servidor
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { io };
