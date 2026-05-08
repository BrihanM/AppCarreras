import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
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

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

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
