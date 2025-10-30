import mongoose, { Document, Schema } from 'mongoose';
import { EstadosAnuncio } from '../utils/anuncio';
import User from './Usuario';

export interface IAdvert extends Document {
  name: string;
  image: string;
  description: string;
  price: number;
  typeAdvert: 'venta' | 'búsqueda';
  tags: string[];
  author: mongoose.Types.ObjectId;
  publicationDate: Date;
  slug: string;
  state: string;
}

const AdvertSchema: Schema = new Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  typeAdvert: { type: String, enum: ['venta', 'búsqueda'], required: true },
  tags: [{ type: String }],
  author: { type: Schema.Types.ObjectId, ref: 'users', required: true },
  publicationDate: { type: Date, default: Date.now },
  slug: { type: String, required: true },
  state: { type: String, required: true, default: EstadosAnuncio.DISPONIBLE },
});

export default mongoose.model<IAdvert>('adverts', AdvertSchema);
