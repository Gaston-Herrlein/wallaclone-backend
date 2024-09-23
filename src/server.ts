import http from 'node:http';
import { Server } from 'socket.io';
import app from './app';
import { connectDB } from './config/database';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from './utils/errors';

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallaclone';
const JWT_SECRET = process.env.JWT_SECRET as string;

const startServer = async () => {
  await connectDB(MONGODB_URI);

  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    }
  });

  io.use((socket, next) => {
    try {
      const accessJWT = socket.handshake.auth.token as string;
      if (!accessJWT) {
        console.log(`Error: no token`);
        throw new UnauthorizedError('Token error');
      }
      const userId = jwt.verify(accessJWT, JWT_SECRET);
      socket.data.userId = userId;
      next();
    } catch (err) {
      console.log(`Error: ${err}`);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join', (room) => {
      console.log(`Socket ${socket.id} joining ${room}`);
      socket.join(room);
    });

    socket.on('send_message', (data) => {
      const { message, room } = data;
      console.log(`msg: ${message.contenido}, room: ${room}`);
      socket.broadcast.to(room).emit('receive_message', message);
    });
  });
  
  server.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
    console.log('Environment variables:');
    console.log('PORT:', process.env.PORT);
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
  });
};

startServer();
