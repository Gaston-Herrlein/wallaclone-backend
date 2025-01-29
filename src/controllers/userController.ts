import { Request, Response, NextFunction } from 'express';
import User from '../models/Usuario';
import Anuncio from '../models/Anuncio';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../config/email';
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors';
import { checkUndefined, isValidName, isValidPassword } from '../utils/helpers';

const JWT_SECRET = process.env.JWT_SECRET;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET debe definirse en variables de entorno');
}

export const recoveryPass = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { email } = req.body;

    const usuarioExistente = await User.findOne({ $or: [{ email }] });
    if (usuarioExistente) {
      const token = jwt.sign({ email: email }, JWT_SECRET, {
        mutatePayload: true,
        expiresIn: '5m',
      });

      const emailOptions = {
        to: email,
        subject: 'Recuperación de Contraseña',
        text: `URL para restablecer su contraseña:${FRONTEND_URL + '/restablecer-contrasena?token=' + token}`,
        html: `<h5>Hola</h5>
              <p>URL para restablecer su contraseña:${FRONTEND_URL + '/restablecer-contrasena?token=' + token}</p>.`,
      };
      sendEmail(emailOptions);
    }
    res
      .status(200)
      .send({ message: 'Se le enviará un email con la url para recuperar su contraseña' });
  } catch (error) {
    next(error);
  }
};

export const resetPass = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.body.token;
  const newPassword = req.body.newPassword;

  try {
    if (isValidPassword(newPassword)) {
      throw new BadRequestError('La contraseña debe tener al menos 6 caracteres');
    }

    const decoded = jwt.verify(token as any, JWT_SECRET);
    const user = await User.findOne({ email: (decoded as any).email });
    if (!user) {
      throw new NotFoundError('No existe el usuario');
    }

    user.password = newPassword;
    user.save();

    res.status(200).send({ message: 'Contraseña restablecida exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const updatePass = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const { oldPass, newPass } = req.body;
  const userId = req.userId;

  try {
    if (isValidPassword(newPass)) {
      throw new BadRequestError('La contraseña debe tener al menos 6 caracteres');
    }
    const user = await User.findOne({ _id: userId });

    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    const passwordsMatch = await user.comparePassword(oldPass);
    if (!passwordsMatch) {
      throw new BadRequestError('La contraseña actual no es correcta');
    }

    user.password = newPass;
    user.save();

    res.status(200).send({ message: 'El cambio de contraseña se realizó exitosamente' });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const userId = req.params.id;

    // Verificar si el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    // Eliminar anuncios asociados al usuario
    await Anuncio.deleteMany({ author: userId });

    // Eliminar el usuario
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Cuenta de usuario eliminada con éxito' });
  } catch (error) {
    next(error);
  }
};

export const updateUserProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { name, email } = req.body;
    const userId = req.userId;

    let isNewName = true;
    let isNewEmail = true;

    const isUndefined: string[] = checkUndefined({ name, email });
    isUndefined.length === 2
      ? () => {
          throw new BadRequestError('Email y nombre de usuario inválidos');
        }
      : undefined;

    //Comprobamos que el usuario exista
    const user = await User.findOne({ _id: userId });
    if (!user) {
      throw new NotFoundError('Usuario no encontrado');
    }

    //Chequeo qué campos se han modificado para hacer las validaciones solo sobre los campos modificados
    if (user.name === name) isNewName = false;
    if (user.email === email) isNewEmail = false;

    if (!isNewName && !isNewEmail) {
      throw new BadRequestError(
        'Para cambiar el nombre de usuario y el email, se deben enviar nuevos valores',
      );
    }

    //Valido el nuevo username y si es válido lo guardo
    if (isNewName && !isUndefined.includes('name')) {
      if (isValidName(name)) {
        throw new BadRequestError('Nombre de usuario inválido');
      }

      const userExists = await User.findOne({ name: name });
      if (userExists) {
        throw new ConflictError('El nombre de usuario ya está en uso');
      }

      user.name = name;
    }

    //Valido el nuevo email y si es válido lo guardo
    if (isNewEmail && !isUndefined.includes('email')) {
      const userExists = await User.findOne({ email });
      if (userExists) {
        throw new ConflictError('El email ya está en uso');
      }

      user.email = email;

      const emailOptions = {
        to: email,
        subject: 'Actualización de correo electrónico',
        text: `Se ha actualizado el correo electrónico`,
        html: `<p>Se ha actualizado el correo electrónico</p>`,
      };
      sendEmail(emailOptions);
    }

    user.save();
    res.status(200).send('Datos actualizados correctamente');
  } catch (error) {
    next(error);
  }
};
