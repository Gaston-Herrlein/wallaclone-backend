import mongoose from 'mongoose';
import Anuncio from '../models/Anuncio';
import User from '../models/Usuario';
import { connectDB } from '../config/database';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const initDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/wallaclone';
    await connectDB(mongoUri);

    rl.question(
      '¿Estás seguro de que deseas eliminar todos los datos y cargarlos nuevamente? (s/n): ',
      async (answer) => {
        if (answer.toLowerCase() === 's') {
          // Eliminar todos los anuncios y usuarios existentes
          await Anuncio.deleteMany({});
          await User.deleteMany({});
          console.log('Datos eliminados.');
          console.log('Base de datos inicializada con éxito');
          mongoose.disconnect(); // Cerrar la conexión
          rl.close();
          process.exit(0);
        } else {
          console.log('Operación cancelada.');
          mongoose.disconnect(); // Cerrar la conexión
          rl.close();
          process.exit(0);
        }
      },
    );
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    mongoose.disconnect(); // Cerrar la conexión en caso de error
    rl.close();
    process.exit(1);
  }
};

initDB();
