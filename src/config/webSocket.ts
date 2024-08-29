import http from 'node:http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET as string;

export const connectWebSocket = (
  app: http.RequestListener<typeof http.IncomingMessage, typeof http.ServerResponse> | undefined,
) => {
  const server = http.createServer(app);
  const io = new Server(server, {
    // Configuración de CORS
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000, //2m
      skipMiddlewares: true,
    },
  });

  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.auth.token as string;
      //Este fragmento de codigo se puede refatorizar porque se utiliza en jwtAuth
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        throw new UnauthorizedError('Token error');
      }
      const token = parts[1];
      if (!token) {
        throw new UnauthorizedError('Usuario no autenticado');
      }
      const userId = jwt.verify(token, JWT_SECRET);
      socket.data.userId = userId;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Usuario ${socket.id} connected`);

    socket.on('sendMessage', (message) => {
      io.emit('receiveMessage', message);
    });

    socket.on('reconnect', () => {
      console.log(`User ${socket.id} reconnected`);
    });

    socket.on('disconnect', () => {
      console.log(`Usuario ${socket.id} disconnect`);
    });
  });

  return server;
};
