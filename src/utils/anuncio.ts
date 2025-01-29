import mongoose from 'mongoose';
import { LeanAnuncio } from '../controllers/anuncioController';
import Anuncio from '../models/Anuncio';

export const isOwner = async (anuncioId: string, userId: string) => {
  try {
    const anuncio: LeanAnuncio | null = await Anuncio.findById(
      new mongoose.Types.ObjectId(anuncioId),
    );
    if (!anuncio) {
      throw new Error('Anuncio no encontrado');
    }
    return anuncio.author._id.toString() === userId;
  } catch (error) {
    console.error('Error verificando propietario del anuncio:', error);
    throw error;
  }
};

export enum EstadosAnuncio {
  DISPONIBLE = 'disponible',
  RESERVADO = 'reservado',
  VENDIDO = 'vendido',
}
