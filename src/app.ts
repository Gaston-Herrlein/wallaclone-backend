import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import anuncioRoutes from './routes/anuncioRoutes';
import swaggerUi from 'swagger-ui-express';
import cache from './middleware/cache';
import morgan from 'morgan';
import helmet from 'helmet';
import { AppError, NotFoundError } from './utils/errors';
import { getImage } from './controllers/imageController';
import chatRoutes from './routes/chatRoutes';


// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Leer el archivo swagger.json
const swaggerPath = path.resolve(__dirname, '../swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, 'utf-8'));

const app = express();

// Configuración de CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// Middleware
app.use(helmet()); // Middleware de seguridad
app.use(morgan('dev')); // Middleware de logging

// Middleware de Content Security Policy
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'",
  );
  next();
});

// Middleware de caché
app.use(cache);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, '../public')));

// Ruta para servir imágenes específicas
app.get('/images/:imageName', getImage);

// Middleware para loggear rutas
app.use((req, res, next) => {
  console.log(`Route accessed: ${req.method} ${req.path}`);
  next();
});

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/anuncios', anuncioRoutes);
app.use('/api/chats', chatRoutes);

// Swagger setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Ruta raíz
app.get('/', (req, res) => {
  res.send('Bienvenido a la API de Wallaclone');
});

// Manejo de rutas no encontradas
app.use((req, res, next) => {
  next(new NotFoundError());
});

// Manejo de errores global
app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
  console.error('Error stack:', err.stack);
  const status = err.status || 500;
  const message = err.message || 'Algo salió mal';
  res.status(status).json({
    success: false,
    status,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : {},
  });
});

export default app;
