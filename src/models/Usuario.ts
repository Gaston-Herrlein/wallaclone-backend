import mongoose, { Document, Schema } from 'mongoose';
import { comparePasswords, hashPassword } from '../utils/password';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  logDate: Date;
  avatar?: string;
  favAdverts: Array<{
    advert: mongoose.Schema.Types.ObjectId;
    dateAdd: Date;
  }>;
  comparePassword(password: string): Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    match: /^[a-zA-Z0-9_-]+$/,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  logDate: { type: Date, default: Date.now },
  avatar: String,
  anunciosFavoritos: [
    {
      advert: { type: Schema.Types.ObjectId, ref: 'Anuncio' },
      dateAdd: { type: Date, default: Date.now },
    },
  ],
});

// Método para hashear la contraseña antes de guardar
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

// Método para comparar contraseñas
UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await comparePasswords(password, this.password);
};

const User = mongoose.model<IUser>('users', UserSchema);
export default User;
