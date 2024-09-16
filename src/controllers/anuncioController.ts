import { Request, Response } from 'express';
import mongoose from 'mongoose';

import Anuncio, { IAnuncio } from '../models/Anuncio';
import Usuario, { IUsuario } from '../models/Usuario';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../utils/errors';
import { EstadosAnuncio, isOwner } from '../utils/anuncio';
import { createSlug } from '../utils/slug';
import { uploadFileToS3, deleteFile } from '../controllers/s3Controller';

// Definir el tipo de respuesta con la población del autor
interface AnuncioPopulated extends Omit<IAnuncio, 'autor'> {
  autor: IUsuario | null;
}

interface LeanAnuncio {
  _id: mongoose.Types.ObjectId;
  nombre: string;
  imagen: string;
  descripcion: string;
  precio: number;
  tipoAnuncio: 'venta' | 'búsqueda';
  tags: string[];
  autor: {
    _id: mongoose.Types.ObjectId;
    nombre: string;
    email: string;
  };
  fechaPublicacion: Date;
  slug: string;
  estado: string;
}

const getAnuncios = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const nombre = (req.query.nombre as string) || '';
    const tag = (req.query.tag as string) || '';
    const minPrecio = req.query.minPrecio;
    const maxPrecio = req.query.maxPrecio;
    const precioMin = minPrecio ? parseFloat(minPrecio as string) : undefined;
    const precioMax = maxPrecio ? parseFloat(maxPrecio as string) : undefined;
    const tipoAnuncio = req.query.tipoAnuncio as 'venta' | 'búsqueda' | undefined;
    const sort = (req.query.sort as string) || 'desc';

    const searchCriteria: any = {};

    // Búsqueda por texto en nombre y descripción
    if (nombre) {
      searchCriteria.$or = [
        { nombre: { $regex: nombre, $options: 'i' } },
        { descripcion: { $regex: nombre, $options: 'i' } },
      ];
    }

    // Filtro por tag
    if (tag) {
      const tagsArray = tag.split(',').map(t => t.trim()); 
      searchCriteria.tags = { $in: tagsArray };
    }

    // Filtro por rango de precio
    if (precioMin !== undefined || precioMax !== undefined) {
      searchCriteria.precio = {};
      if (precioMin !== undefined) {
        searchCriteria.precio.$gte = precioMin;
      }
      if (precioMax !== undefined) {
        searchCriteria.precio.$lte = precioMax;
      }
    }

    // Filtro por tipo de anuncio
    if (tipoAnuncio) {
      searchCriteria.tipoAnuncio = tipoAnuncio;
    }

    // Filtro por estado
    searchCriteria.estado = { $ne: 'vendido'};

    const totalAnuncios = await Anuncio.countDocuments(searchCriteria);

    const sortOrder = sort === 'asc' ? 1 : -1;
    const anuncios = await Anuncio.find(searchCriteria)
      .sort({ fechaPublicacion: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('autor', 'nombre email')
      .lean<AnuncioPopulated[]>()
      .exec();

    const processedAnuncios = anuncios.map((anuncio) => {
      return {
        _id: (anuncio._id as mongoose.Types.ObjectId).toString(),
        nombre: anuncio.nombre,
        imagen: anuncio.imagen,
        descripcion: anuncio.descripcion,
        precio: anuncio.precio,
        tipoAnuncio: anuncio.tipoAnuncio,
        tags: anuncio.tags,
        autor: anuncio.autor
          ? {
              _id: (anuncio.autor._id as mongoose.Types.ObjectId).toString(),
              nombre: anuncio.autor.nombre,
              email: anuncio.autor.email,
            }
          : null,
        fechaPublicacion: anuncio.fechaPublicacion,
        slug: anuncio.slug,
        estado: anuncio.estado,
      };
    });

    res.status(200).json({
      anuncios: processedAnuncios,
      total: totalAnuncios,
      page,
      totalPages: Math.ceil(totalAnuncios / limit),
    });
  } catch (error: unknown) {
    console.error('Error al obtener los anuncios:', error);
    if (error instanceof Error) {
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        message: 'Error en el servidor',
        error: 'An unknown error occurred',
      });
    }
  }
};

const getAnunciosUsuario = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombreUsuario } = req.params;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const nombre = (req.query.nombre as string) || '';
    const tag = (req.query.tag as string) || '';
    const minPrecio = req.query.minPrecio;
    const maxPrecio = req.query.maxPrecio;
    const precioMin = minPrecio ? parseFloat(minPrecio as string) : undefined;
    const precioMax = maxPrecio ? parseFloat(maxPrecio as string) : undefined;
    const tipoAnuncio = req.query.tipoAnuncio as 'venta' | 'búsqueda' | undefined;
    const sort = (req.query.sort as string) || 'desc';

    const usuario = await Usuario.findOne({ nombre: nombreUsuario });
    if (!usuario) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    console.log(
      `Fetching anuncios for user ${nombreUsuario} with page: ${page}, limit: ${limit}, nombre: ${nombre}, tag: ${tag}, precioMin: ${precioMin}, precioMax: ${precioMax}, tipoAnuncio: ${tipoAnuncio}, sort: ${sort}`,
    );

    const searchCriteria: any = { autor: usuario._id };

    // Búsqueda por texto en nombre y descripción
    if (nombre) {
      searchCriteria.$or = [
        { nombre: { $regex: nombre, $options: 'i' } },
        { descripcion: { $regex: nombre, $options: 'i' } },
      ];
    }

    // Filtro por tag
    if (tag) {
      searchCriteria.tags = { $regex: tag, $options: 'i' };
    }

    // Filtro por rango de precio
    if (precioMin !== undefined || precioMax !== undefined) {
      searchCriteria.precio = {};
      if (precioMin !== undefined) {
        searchCriteria.precio.$gte = precioMin;
        console.log('Adding min price to search criteria:', precioMin);
      }
      if (precioMax !== undefined) {
        searchCriteria.precio.$lte = precioMax;
        console.log('Adding max price to search criteria:', precioMax);
      }
    }

    // Filtro por tipo de anuncio
    if (tipoAnuncio) {
      searchCriteria.tipoAnuncio = tipoAnuncio;
    }

    console.log('Search criteria:', JSON.stringify(searchCriteria, null, 2));

    const totalAnuncios = await Anuncio.countDocuments(searchCriteria);

    const sortOrder = sort === 'asc' ? 1 : -1;

    const anuncios = await Anuncio.find(searchCriteria)
      .sort({ fechaPublicacion: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('autor', 'nombre email')
      .lean<LeanAnuncio[]>();

    const processedAnuncios = anuncios.map((anuncio) => {
      return {
        _id: anuncio._id.toString(),
        nombre: anuncio.nombre,
        imagen: anuncio.imagen,
        descripcion: anuncio.descripcion,
        precio: anuncio.precio,
        tipoAnuncio: anuncio.tipoAnuncio,
        tags: anuncio.tags,
        autor: anuncio.autor
          ? {
              _id: anuncio.autor._id.toString(),
              nombre: anuncio.autor.nombre,
              email: anuncio.autor.email,
            }
          : null,
        fechaPublicacion: anuncio.fechaPublicacion,
        slug: anuncio.slug,
        estado: anuncio.estado,
      };
    });

    res.status(200).json({
      anuncios: processedAnuncios,
      total: totalAnuncios,
      page,
      totalPages: Math.ceil(totalAnuncios / limit),
    });
  } catch (error: unknown) {
    console.error('Error al obtener los anuncios del usuario:', error);
    if (error instanceof Error) {
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        message: 'Error en el servidor',
        error: 'An unknown error occurred',
      });
    }
  }
};

const getAnuncio = async (req: Request, res: Response): Promise<void> => {
  try {
    const slug = req.params.slug;

    const anuncio = await Anuncio.findOne({ slug: slug })
      .populate('autor', 'nombre email')
      .lean<LeanAnuncio>();

    res.status(200).json({
      result: anuncio,
    });
  } catch (error: unknown) {
    console.error('Error al obtener el anuncio:', error);
    if (error instanceof Error) {
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        message: 'Error en el servidor',
        error: 'An unknown error occurred',
      });
    }
  }
};

const deleteAnuncio = async (req: Request, res: Response): Promise<void> => {
  const { anuncioId } = req.params;
  const userId = req.userId;

  try {
    if (!userId) {
      throw new ForbiddenError();
    }

    const userIsOwner = await isOwner(anuncioId, userId);
    if (userIsOwner) {
      const anuncio = await Anuncio.findOneAndDelete({ _id: anuncioId });
      const key = anuncio?.imagen ? anuncio?.imagen : '';
      deleteFile(key);
    }
    res.status(200).send('Anuncio eliminado correctamente');
  } catch (error: unknown) {
    console.error('Error al eliminar anuncio:', error);
    if (error instanceof Error) {
      res.status(500).json({
        message: 'Error en el servidor',
        error: error.message,
        stack: error.stack,
      });
    } else {
      res.status(500).json({
        message: 'Error en el servidor',
        error: 'Se produjo un error desconocido',
      });
    }
  }
};

const createAnuncio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, descripcion, tipoAnuncio, precio, tags } = req.body;
    const imagen = req.file ? req.file : null;

    if (!req.userId) {
      res.status(401).json({ message: 'Usuario no autenticado' });
      return;
    }

    if (!nombre || !imagen || !descripcion || !tipoAnuncio || !precio) {
      throw new BadRequestError('Faltan campos requeridos');
    }

    const slug = await createSlug(nombre);
    const filename = `${Date.now()}-${imagen.originalname}`;

    try {
      await uploadFileToS3(imagen, filename);
    } catch (error) {
      console.log(error);
    }

    const nuevoAnuncio: IAnuncio = new Anuncio({
      nombre,
      imagen: filename,
      descripcion,
      tipoAnuncio,
      precio,
      tags: tags || [],
      autor: req.userId,
      slug,
    });

    await nuevoAnuncio.save();

    res.status(201).json({
      message: 'Anuncio creado exitosamente',
      anuncio: nuevoAnuncio,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(error instanceof BadRequestError ? 400 : 500).json({
        message: 'Error al crear el anuncio',
        error: error.message,
      });
    } else {
      res.status(500).json({
        message: 'Error desconocido al crear el anuncio',
      });
    }
  }
};

const editAnuncio = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('Formato de ID inválido');
    }

    const { nombre, descripcion, tipoAnuncio, precio, tags } = req.body;
    const imagen = req.file ? req.file.filename : undefined;

    if (!req.userId) {
      throw new UnauthorizedError('Usuario no autenticado');
    }

    const userIsOwner = await isOwner(id, req.userId);
    if (!userIsOwner) {
      throw new ForbiddenError('No tienes permiso para editar este anuncio');
    }

    const anuncioExistente = await Anuncio.findById(id);
    if (!anuncioExistente) {
      throw new NotFoundError('Anuncio no encontrado');
    }

    const datosActualizados: Partial<IAnuncio> = {
      nombre: nombre || anuncioExistente.nombre,
      descripcion: descripcion || anuncioExistente.descripcion,
      tipoAnuncio: tipoAnuncio || anuncioExistente.tipoAnuncio,
      precio: precio !== undefined ? precio : anuncioExistente.precio,
      tags: tags || anuncioExistente.tags,
    };

    let oldKey = '';
    if (imagen) {
      datosActualizados.imagen = imagen;
      oldKey = anuncioExistente?.imagen ? anuncioExistente?.imagen : '';
    }

    // Actualizar el slug solo si el nombre ha cambiado
    if (nombre && nombre !== anuncioExistente.nombre) {
      datosActualizados.slug = await createSlug(nombre);
    }

    const anuncioActualizado = await Anuncio.findByIdAndUpdate(id, datosActualizados, {
      new: true,
      runValidators: true,
    });

    if (!anuncioActualizado) {
      throw new NotFoundError('Anuncio no encontrado después de la actualización');
    }

    if (oldKey !== '' && imagen && req.file) {
      deleteFile(oldKey);
      uploadFileToS3(req.file, imagen);
    }

    res.status(200).json({
      message: 'Anuncio actualizado exitosamente',
      anuncio: anuncioActualizado,
    });
  } catch (error) {
    console.error('Error al actualizar el anuncio:', error);

    if (error instanceof AppError) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({
        message: 'Error en el servidor',
        error: error instanceof Error ? error.message : 'Error desconocido',
      });
    }
  }
};

const changeStatusAnuncio = async (req: Request, res: Response): Promise<void> => {
  const { anuncioId } = req.params;
  const { estado } = req.body;
  const userId = req.userId;

  try {
    if (!userId) {
      throw new ForbiddenError();
    }

    const userIsOwner = await isOwner(anuncioId, userId);
    if (!userIsOwner) {
      throw new ForbiddenError('Solo el dueño puede actualizar el estado de un anuncio');
    }

    if (!Object.values(EstadosAnuncio).includes(estado)) {
      throw new BadRequestError(
        'El estado enviado no existe entre los posibles estados del anuncio',
      );
    }

    const anuncio = await Anuncio.findOne({ _id: anuncioId });
    if (!anuncio) {
      throw new BadRequestError('No existe un anuncio con ese id');
    }

    if (anuncio.estado === EstadosAnuncio.VENDIDO) {
      throw new BadRequestError(
        'El anuncio se encuentra en estado vendido, por lo que no puede volver a estar disponible',
      );
    }

    if (estado === anuncio.estado) {
      throw new BadRequestError('El estado enviado es igual al estado actual');
    }

    anuncio.estado = estado;
    anuncio.save();

    res.status(200).send({ result: 'Estado del anuncio actualizado correctamente' });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({
        message: error.message,
        error: true,
      });
    } else {
      res.status(500).json({
        message: 'Ocurrió un error inesperado',
        error: true,
      });
    }
  }
};

const getStatusAnuncio = async (req: Request, res: Response): Promise<void> => {
  try {
    const estados = Object.values(EstadosAnuncio);

    res.status(200).json({
      result: estados,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({
        message: error.message,
        error: true,
      });
    } else {
      res.status(500).json({
        message: 'Ocurrió un error inesperado',
        error: true,
      });
    }
  }
};

export {
  LeanAnuncio,
  getAnuncios,
  getAnunciosUsuario,
  getAnuncio,
  deleteAnuncio,
  createAnuncio,
  editAnuncio,
  changeStatusAnuncio,
  getStatusAnuncio,
};
