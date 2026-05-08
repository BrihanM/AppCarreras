import express from 'express';
import http from 'http';
import cors from 'cors';
import parseCookies from './middleware/parseCookies';
import cookieAuth from './middleware/cookieAuth';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { setIo } from './socket';
import { connectDB } from './config/db';
import authRoutes from './modules/auth/application/routes';
import usersRoutes from './modules/users/application/routes';
import vehiclesRoutes from './modules/vehicles/application/routes';
import challengesRoutes from './modules/challenges/application/routes';
import notificationsRoutes from './modules/notifications/application/routes';
import categoriesRoutes from './modules/categories/application/routes';

dotenv.config();

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

// Middlewares
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(parseCookies);
// attach optional auth from cookie or Authorization header
app.use(cookieAuth(true));

// Routes
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
// Socket.io authentication using cookie or auth header
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

io.on('connection', (socket) => {
  const user = (socket as any).data?.user;
  console.log(`Client connected: ${socket.id}`, user ? 'user=' + JSON.stringify(user) : 'anonymous');
  if (user && user.id) {
    socket.join(`user:${user.id}`);
  }

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 4000;

// Connect to DB and start
connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export { io };
