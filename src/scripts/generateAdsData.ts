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
  name: string;
  image: string;
  description: string;
  price: number;
  typeAdvert: 'venta' | 'búsqueda';
  tags: string[];
  author: Types.ObjectId;
  publicationDate: Date;
}

const usuariosData = [
  { name: 'usuario1', email: 'usuario1@example.com', password: 'password1' },
  { name: 'usuario2', email: 'usuario2@example.com', password: 'password2' },
  { name: 'usuario3', email: 'usuario3@example.com', password: 'password3' },
  { name: 'usuario4', email: 'usuario4@example.com', password: 'password4' },
  { name: 'usuario5', email: 'usuario5@example.com', password: 'password5' },
  { name: 'usuario6', email: 'usuario6@example.com', password: 'password6' },
  { name: 'usuario7', email: 'usuario7@example.com', password: 'password7' },
  { name: 'usuario8', email: 'usuario8@example.com', password: 'password8' },
  { name: 'usuario9', email: 'usuario9@example.com', password: 'password9' },
  { name: 'usuario10', email: 'usuario10@example.com', password: 'password10' },
];

const anunciosData: Partial<Anuncio>[] = [
  {
    name: 'Impresora 3D',
    image: '3d-printer.jpg',
    description: 'Impresora 3D de alta precisión',
    price: 1000,
    typeAdvert: 'venta',
    tags: ['tech', '3d'],
    publicationDate: new Date('2024-07-01'),
  },
  {
    name: 'Monitor 4K',
    image: '4k-monitor.jpg',
    description: 'Monitor 4K UHD de 27 pulgadas',
    price: 400,
    typeAdvert: 'venta',
    tags: ['tech', 'monitor'],
    publicationDate: new Date('2024-07-02'),
  },
  {
    name: 'Altavoces Bluetooth',
    image: 'bluetooth-speakers.jpg',
    description: 'Altavoces portátiles Bluetooth con gran calidad de sonido',
    price: 150,
    typeAdvert: 'venta',
    tags: ['tech', 'audio'],
    publicationDate: new Date('2024-07-03'),
  },
  {
    name: 'Drone',
    image: 'drone.jpg',
    description: 'Drone con cámara 4K y estabilizador',
    price: 800,
    typeAdvert: 'venta',
    tags: ['tech', 'drone'],
    publicationDate: new Date('2024-07-04'),
  },
  {
    name: 'Cámara DSLR',
    image: 'dslr-camera.jpg',
    description: 'Cámara DSLR profesional, ideal para fotografía de paisajes.',
    price: 600,
    typeAdvert: 'venta',
    tags: ['tech', 'photo'],
    publicationDate: new Date('2024-07-05'),
  },
  {
    name: 'iPhone 12',
    image: 'iphone12.jpg',
    description: 'iPhone 12 en excelente estado, poco uso.',
    price: 500,
    typeAdvert: 'venta',
    tags: ['mobile', 'tech'],
    publicationDate: new Date('2024-07-06'),
  },
  {
    name: 'MacBook Pro',
    image: 'macbook-pro.jpg',
    description: 'MacBook Pro 2021, 16GB RAM, 512GB SSD.',
    price: 1200,
    typeAdvert: 'venta',
    tags: ['tech', 'work'],
    publicationDate: new Date('2024-07-07'),
  },
  {
    name: 'Teclado Mecánico',
    image: 'mechanical-keyboard.jpg',
    description: 'Teclado mecánico retroiluminado',
    price: 100,
    typeAdvert: 'venta',
    tags: ['tech', 'keyboard'],
    publicationDate: new Date('2024-07-08'),
  },
  {
    name: 'Bicicleta de Montaña',
    image: 'mountain-bike.jpg',
    description: 'Bicicleta de montaña casi nueva, ideal para principiantes.',
    price: 300,
    typeAdvert: 'venta',
    tags: ['lifestyle', 'sports'],
    publicationDate: new Date('2024-07-09'),
  },
  {
    name: 'Nintendo Switch',
    image: 'nintendo-switch.jpg',
    description: 'Consola Nintendo Switch con juegos incluidos',
    price: 350,
    typeAdvert: 'venta',
    tags: ['gaming', 'tech'],
    publicationDate: new Date('2024-07-10'),
  },
  {
    name: 'Silla de Oficina',
    image: 'office-chair.jpg',
    description: 'Silla ergonómica de oficina',
    price: 200,
    typeAdvert: 'venta',
    tags: ['furniture', 'office'],
    publicationDate: new Date('2024-07-11'),
  },
  {
    name: 'PlayStation 5',
    image: 'ps5.jpg',
    description: 'PS5 nueva, en caja sellada.',
    price: 450,
    typeAdvert: 'venta',
    tags: ['tech', 'gaming'],
    publicationDate: new Date('2024-07-12'),
  },
  {
    name: 'Robot Aspiradora',
    image: 'robot-vacuum.jpg',
    description: 'Robot aspiradora con programación automática',
    price: 250,
    typeAdvert: 'venta',
    tags: ['home', 'tech'],
    publicationDate: new Date('2024-07-13'),
  },
  {
    name: 'Smartwatch',
    image: 'smartwatch.jpg',
    description: 'Reloj inteligente con monitor de salud',
    price: 150,
    typeAdvert: 'venta',
    tags: ['tech', 'wearable'],
    publicationDate: new Date('2024-07-14'),
  },
  {
    name: 'Tablet',
    image: 'tablet.jpg',
    description: 'Tablet de 10 pulgadas con pantalla HD',
    price: 200,
    typeAdvert: 'venta',
    tags: ['tech', 'tablet'],
    publicationDate: new Date('2024-07-15'),
  },
  {
    name: 'Auriculares Inalámbricos',
    image: 'wireless-headphones.jpg',
    description: 'Auriculares inalámbricos con cancelación de ruido',
    price: 180,
    typeAdvert: 'venta',
    tags: ['tech', 'audio'],
    publicationDate: new Date('2024-07-16'),
  },
];

const generateData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallaclone';
    await connectDB(mongoUri);

    // Crear usuarios
    const usuariosCifrados = await Promise.all(
      usuariosData.map(async (usuario) => {
        const contraseñaCifrada = await hashPassword(usuario.password);

        return {
          ...usuario,
          password: contraseñaCifrada,
        };
      }),
    );

    const usuarios = await User.insertMany(usuariosCifrados);
    console.log('Usuarios creados:', usuarios);

    // Crear anuncios
    const anunciosCreados = [];
    for (let i = 0; i < anunciosData.length; i++) {
      const anuncio = anunciosData[i];
      const author = usuarios[i % usuarios.length];
      const slug = await createSlug(anuncio.name ?? '');
      const nuevoAnuncio = new Anuncio({
        ...anuncio,
        author: author._id,
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
