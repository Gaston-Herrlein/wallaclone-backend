import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import Chat from '../models/Chat';
import { AppError, BadRequestError, NotFoundError } from '../utils/errors';


export const guardarChat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { chatId, contenido } = req.body;
    const userId = req.userId;
    const userObjectId = new Types.ObjectId(userId as string);

    if (!chatId || !contenido) {
      console.error('Faltan campos requeridos:', { chatId, contenido });
      throw new BadRequestError('Faltan campos requeridos');
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      console.error(`ID de chat inválido: ${chatId}`);
      throw new BadRequestError('ID de chat inválido');
    }

    const chat = await Chat.findOne({ _id: chatId });

    if (!chat) {
      console.log(`Chat no encontrado con ID: ${chatId}`);
      throw new NotFoundError('Chat no encontrado');
    }

    const newMessage = {
      emisor: userObjectId,
      contenido,
      fechaEnvio: new Date(),
      leido: false,
    };

    chat.mensajes.push(newMessage);

    await chat.save();
    (await chat.populate('owner', 'nombre')).populate('user', 'nombre');

    res.status(201).json({
      message: 'Mensaje guardado exitosamente',
      chat,
      newMessage, 
    });
  } catch (error) {
    console.error('Error en guardarChat:', error);
    if (error instanceof AppError) {
      res.status(error.status).json({
        message: error.message,
        error: true,
      });
    } else {
      next(error);
    }
  }
};


export const getUserConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const userId = req.userId;
        const userObjectId = new Types.ObjectId(userId as string);

        const chats = await Chat.find({ $or: [{ owner: userObjectId }, { user: userObjectId }] })
          .populate('anuncio', '_id nombre slug')
          .populate('owner', '_id nombre')
          .populate('user', '_id nombre')
          .exec();

        res.status(200).json({
          message: 'Chats encontrados',
          results: chats,
        });
    } catch (error) {
        console.error('Error en getUserConversations:', error);
        if (error instanceof AppError) {
            res.status(error.status).json({
                message: error.message,
                error: true,
            });
        } else {
            next(error);
        }
    }
};


export const getOrCreateChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { advertId, ownerId, userId } = req.query;

    if (!advertId || !ownerId || !userId) {
      throw new BadRequestError('advertId, ownerId y userId son requeridos');
    }

    const advertObjectId = new Types.ObjectId(advertId as string);
    const ownerObjectId = new Types.ObjectId(ownerId as string);
    const userObjectId = new Types.ObjectId(userId as string);

    // Busco si existe el chat
    const chat = await Chat.findOne({ anuncio: advertObjectId, owner: ownerObjectId, user: userObjectId })
      .populate('anuncio')
      .populate('owner')
      .populate('user')
      .select('anuncio owner user mensajes');

    // Si no existe el chat, creo uno nuevo
    if (!chat) {
      const newChat = new Chat({
        anuncio: advertId,
        owner: ownerId,
        user: userId,
        mensajes: []
      });

      await newChat.save();
      
      res.status(201).json({
        message: 'Chat creado exitosamente',
        result: newChat,
      });
    } else {
      res.status(200).json({
        message: 'Chat encontrado',
        result: chat,
      });
    }    
  } catch (error) {
    next(error);
  }
};
