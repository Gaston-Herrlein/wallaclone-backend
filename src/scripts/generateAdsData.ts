import path from 'path';
import { Types } from 'mongoose';
import mongoose from 'mongoose';
import User from '../models/Usuario';
import Anuncio from '../models/Anuncio';
import { connectDB } from '../config/database';
import dotenv from 'dotenv';
import { createSlug } from '../utils/slug';
import { hashPassword } from '../utils/password';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Anuncio {
  nombre: string;
  imagen: string;
  descripcion: string;
  precio: number;
  tipoAnuncio: 'venta' | 'búsqueda';
  tags: string[];
  autor: Types.ObjectId;
  fechaPublicacion: Date;
}

const usuariosData = [
  { nombre: 'usuario1', email: 'usuario1@example.com', contraseña: 'password1' },
  { nombre: 'usuario2', email: 'usuario2@example.com', contraseña: 'password2' },
  { nombre: 'usuario3', email: 'usuario3@example.com', contraseña: 'password3' },
  { nombre: 'usuario4', email: 'usuario4@example.com', contraseña: 'password4' },
  { nombre: 'usuario5', email: 'usuario5@example.com', contraseña: 'password5' },
  { nombre: 'usuario6', email: 'usuario6@example.com', contraseña: 'password6' },
  { nombre: 'usuario7', email: 'usuario7@example.com', contraseña: 'password7' },
  { nombre: 'usuario8', email: 'usuario8@example.com', contraseña: 'password8' },
  { nombre: 'usuario9', email: 'usuario9@example.com', contraseña: 'password9' },
  { nombre: 'usuario10', email: 'usuario10@example.com', contraseña: 'password10' },
];

const anunciosData: Partial<Anuncio>[] = [
  {
    nombre: 'Impresora 3D',
    imagen: '3d-printer.jpg',
    descripcion: 'Impresora 3D de alta precisión',
    precio: 1000,
    tipoAnuncio: 'venta',
    tags: ['tech', '3d'],
    fechaPublicacion: new Date('2024-07-01'),
  },
  {
    nombre: 'Monitor 4K',
    imagen: '4k-monitor.jpg',
    descripcion: 'Monitor 4K UHD de 27 pulgadas',
    precio: 400,
    tipoAnuncio: 'venta',
    tags: ['tech', 'monitor'],
    fechaPublicacion: new Date('2024-07-02'),
  },
  {
    nombre: 'Altavoces Bluetooth',
    imagen: 'bluetooth-speakers.jpg',
    descripcion: 'Altavoces portátiles Bluetooth con gran calidad de sonido',
    precio: 150,
    tipoAnuncio: 'venta',
    tags: ['tech', 'audio'],
    fechaPublicacion: new Date('2024-07-03'),
  },
  {
    nombre: 'Drone',
    imagen: 'drone.jpg',
    descripcion: 'Drone con cámara 4K y estabilizador',
    precio: 800,
    tipoAnuncio: 'venta',
    tags: ['tech', 'drone'],
    fechaPublicacion: new Date('2024-07-04'),
  },
  {
    nombre: 'Cámara DSLR',
    imagen: 'dslr-camera.jpg',
    descripcion: 'Cámara DSLR profesional, ideal para fotografía de paisajes.',
    precio: 600,
    tipoAnuncio: 'venta',
    tags: ['tech', 'photo'],
    fechaPublicacion: new Date('2024-07-05'),
  },
  {
    nombre: 'iPhone 12',
    imagen: 'iphone12.jpg',
    descripcion: 'iPhone 12 en excelente estado, poco uso.',
    precio: 500,
    tipoAnuncio: 'venta',
    tags: ['mobile', 'tech'],
    fechaPublicacion: new Date('2024-07-06'),
  },
  {
    nombre: 'MacBook Pro',
    imagen: 'macbook-pro.jpg',
    descripcion: 'MacBook Pro 2021, 16GB RAM, 512GB SSD.',
    precio: 1200,
    tipoAnuncio: 'venta',
    tags: ['tech', 'work'],
    fechaPublicacion: new Date('2024-07-07'),
  },
  {
    nombre: 'Teclado Mecánico',
    imagen: 'mechanical-keyboard.jpg',
    descripcion: 'Teclado mecánico retroiluminado',
    precio: 100,
    tipoAnuncio: 'venta',
    tags: ['tech', 'keyboard'],
    fechaPublicacion: new Date('2024-07-08'),
  },
  {
    nombre: 'Bicicleta de Montaña',
    imagen: 'mountain-bike.jpg',
    descripcion: 'Bicicleta de montaña casi nueva, ideal para principiantes.',
    precio: 300,
    tipoAnuncio: 'venta',
    tags: ['lifestyle', 'sports'],
    fechaPublicacion: new Date('2024-07-09'),
  },
  {
    nombre: 'Nintendo Switch',
    imagen: 'nintendo-switch.jpg',
    descripcion: 'Consola Nintendo Switch con juegos incluidos',
    precio: 350,
    tipoAnuncio: 'venta',
    tags: ['gaming', 'tech'],
    fechaPublicacion: new Date('2024-07-10'),
  },
  {
    nombre: 'Silla de Oficina',
    imagen: 'office-chair.jpg',
    descripcion: 'Silla ergonómica de oficina',
    precio: 200,
    tipoAnuncio: 'venta',
    tags: ['furniture', 'office'],
    fechaPublicacion: new Date('2024-07-11'),
  },
  {
    nombre: 'PlayStation 5',
    imagen: 'ps5.jpg',
    descripcion: 'PS5 nueva, en caja sellada.',
    precio: 450,
    tipoAnuncio: 'venta',
    tags: ['tech', 'gaming'],
    fechaPublicacion: new Date('2024-07-12'),
  },
  {
    nombre: 'Robot Aspiradora',
    imagen: 'robot-vacuum.jpg',
    descripcion: 'Robot aspiradora con programación automática',
    precio: 250,
    tipoAnuncio: 'venta',
    tags: ['home', 'tech'],
    fechaPublicacion: new Date('2024-07-13'),
  },
  {
    nombre: 'Smartwatch',
    imagen: 'smartwatch.jpg',
    descripcion: 'Reloj inteligente con monitor de salud',
    precio: 150,
    tipoAnuncio: 'venta',
    tags: ['tech', 'wearable'],
    fechaPublicacion: new Date('2024-07-14'),
  },
  {
    nombre: 'Tablet',
    imagen: 'tablet.jpg',
    descripcion: 'Tablet de 10 pulgadas con pantalla HD',
    precio: 200,
    tipoAnuncio: 'venta',
    tags: ['tech', 'tablet'],
    fechaPublicacion: new Date('2024-07-15'),
  },
  {
    nombre: 'Auriculares Inalámbricos',
    imagen: 'wireless-headphones.jpg',
    descripcion: 'Auriculares inalámbricos con cancelación de ruido',
    precio: 180,
    tipoAnuncio: 'venta',
    tags: ['tech', 'audio'],
    fechaPublicacion: new Date('2024-07-16'),
  },
];

const generateData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallaclone';
    await connectDB(mongoUri);

    // Crear usuarios
    const usuariosCifrados = await Promise.all(
      usuariosData.map(async (usuario) => {
        const contraseñaCifrada = await hashPassword(usuario.contraseña);

        return {
          ...usuario,
          contraseña: contraseñaCifrada,
        };
      }),
    );

    const usuarios = await User.insertMany(usuariosCifrados);
    console.log('Usuarios creados:', usuarios);

    // Crear anuncios
    const anunciosCreados = [];
    for (let i = 0; i < anunciosData.length; i++) {
      const anuncio = anunciosData[i];
      const autor = usuarios[i % usuarios.length];
      const slug = await createSlug(anuncio.nombre ?? '');
      const nuevoAnuncio = new Anuncio({
        ...anuncio,
        autor: autor._id,
        slug,
      });
      await nuevoAnuncio.save();
      anunciosCreados.push(nuevoAnuncio);
    }

    console.log('Anuncios creados:', anunciosCreados);
    console.log('Datos generados correctamente');
  } catch (error) {
    console.error('Error al generar datos:', error);
  } finally {
    await mongoose.disconnect();
  }
};

generateData();
