import { Request, Response } from 'express';
import mongoose, { Model, Types } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import {
  getAnuncios,
  getAnunciosUsuario,
  editAnuncio,
  getAnuncio,
  deleteAnuncio,
} from '../controllers/anuncioController';
import Anuncio, { IAdvert } from '../models/Anuncio';
import User, { IUser } from '../models/Usuario';
import * as anuncioUtils from '../utils/anuncio';
import { BadRequestError, UnauthorizedError, ForbiddenError, NotFoundError } from '../utils/errors';
import path from 'path';
import fs from 'fs';

// Definir el tipo del modelo de Anuncio
type AnuncioModel = Model<IAdvert, {}, {}>;

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  jest.setTimeout(30000);
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

describe('Anuncio Controller', () => {
  beforeEach(async () => {
    await Anuncio.deleteMany({});
    await User.deleteMany({});
  });

  describe('editAnuncio', () => {
    it('debería actualizar un anuncio exitosamente incluyendo una nueva imagen', async () => {
      const usuario: IUser = await User.create({
        name: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        password: 'password',
      });

      const anuncio = await (Anuncio as AnuncioModel).create({
        name: 'Anuncio Original',
        description: 'Descripción original',
        image: 'imagen-original.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario._id,
        publicationDate: new Date(),
      });

      const id = (anuncio._id as mongoose.Types.ObjectId).toString();
      const mockRequest = {
        params: { id },
        body: {
          nombre: 'Anuncio Actualizado',
          descripcion: 'Descripción actualizada',
          tipoAnuncio: 'venta',
          precio: 150,
          tags: ['nuevo', 'tecnología'],
        },
        file: { filename: 'imagen-actualizada.jpg' },
        userId: (anuncio._id as mongoose.Types.ObjectId).toString(),
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      jest.spyOn(anuncioUtils, 'isOwner').mockResolvedValue(true);
      jest.spyOn(fs, 'unlinkSync').mockImplementationOnce(() => {}); // Mockear la eliminación de la imagen anterior

      await editAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Anuncio actualizado exitosamente',
          anuncio: expect.objectContaining({
            nombre: 'Anuncio Actualizado',
            imagen: '/images/imagen-actualizada.jpg',
            descripcion: 'Descripción actualizada',
            precio: 150,
            tags: ['nuevo', 'tecnología'],
          }),
        }),
      );
    });

    it('debería actualizar un anuncio exitosamente sin cambiar la imagen si no se proporciona una nueva', async () => {
      const usuario = await User.create({
        name: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        password: 'password',
      });

      const anuncio = await (Anuncio as AnuncioModel).create({
        name: 'Anuncio Original',
        description: 'Descripción original',
        image: 'imagen-original.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario._id,
        publicationDate: new Date(),
      });

      const id = (anuncio._id as mongoose.Types.ObjectId).toString();
      const mockRequest = {
        params: { id },
        body: {
          nombre: 'Anuncio Actualizado',
          descripcion: 'Descripción actualizada',
          tipoAnuncio: 'venta',
          precio: 150,
          tags: ['nuevo', 'tecnología'],
        },
        userId: (usuario._id as mongoose.Types.ObjectId).toString(),
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      jest.spyOn(anuncioUtils, 'isOwner').mockResolvedValue(true);

      await editAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Anuncio actualizado exitosamente',
          anuncio: expect.objectContaining({
            nombre: 'Anuncio Actualizado',
            imagen: 'imagen-original.jpg',
            descripcion: 'Descripción actualizada',
            precio: 150,
            tags: ['nuevo', 'tecnología'],
          }),
        }),
      );
    });

    it('debería retornar un error si el usuario no está autenticado', async () => {
      const anuncio: IAdvert = new Anuncio({
        nombre: 'Anuncio Original',
        descripcion: 'Descripción original',
        imagen: 'imagen-original.jpg',
        precio: 100,
        tipoAnuncio: 'venta',
        fechaPublicacion: new Date(),
      });
      await anuncio.save();

      const id = (anuncio._id as mongoose.Types.ObjectId).toString();
      const mockRequest = {
        params: { id },
        body: {
          nombre: 'Anuncio Actualizado',
          descripcion: 'Descripción actualizada',
          tipoAnuncio: 'venta',
          precio: 150,
          tags: ['nuevo', 'tecnología'],
        },
        userId: undefined,
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await editAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(401);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Usuario no autenticado',
      });
    });

    it('debería retornar un error si el anuncio no pertenece al usuario autenticado', async () => {
      const usuario1 = await User.create({
        name: 'Usuario1',
        email: 'usuario1@prueba.com',
        password: 'password',
      });

      const usuario2 = await User.create({
        name: 'Usuario2',
        email: 'usuario2@prueba.com',
        password: 'password',
      });

      const anuncio = await (Anuncio as AnuncioModel).create({
        name: 'Anuncio Original',
        description: 'Descripción original',
        image: 'imagen-original.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario1._id,
        publicationDate: new Date(),
      });

      const id = (anuncio._id as mongoose.Types.ObjectId).toString();
      const mockRequest = {
        params: { id },
        body: {
          nombre: 'Anuncio Actualizado',
          descripcion: 'Descripción actualizada',
          tipoAnuncio: 'venta',
          precio: 150,
          tags: ['nuevo', 'tecnología'],
        },
        userId: (anuncio._id as mongoose.Types.ObjectId).toString(),
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      jest.spyOn(anuncioUtils, 'isOwner').mockResolvedValue(false);

      await editAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'No tienes permiso para editar este anuncio',
      });
    });

    it('debería retornar un error si el anuncio no existe', async () => {
      const mockRequest = {
        params: { id: new Types.ObjectId().toString() },
        body: {
          nombre: 'Anuncio Actualizado',
          descripcion: 'Descripción actualizada',
          tipoAnuncio: 'venta',
          precio: 150,
          tags: ['nuevo', 'tecnología'],
        },
        userId: new Types.ObjectId().toString(),
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      jest.spyOn(anuncioUtils, 'isOwner').mockResolvedValue(true);

      await editAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Anuncio no encontrado',
      });
    });

    it('debería eliminar la imagen anterior cuando se sube una nueva', async () => {
      const usuario = await User.create({
        name: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        password: 'password',
      });

      const anuncio = await (Anuncio as AnuncioModel).create({
        name: 'Anuncio Original',
        description: 'Descripción original',
        image: 'imagen-original.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario._id,
        publicationDate: new Date(),
      });

      const id = (anuncio._id as mongoose.Types.ObjectId).toString();
      const mockRequest = {
        params: { id },
        body: {
          nombre: 'Anuncio Actualizado',
          descripcion: 'Descripción actualizada',
          tipoAnuncio: 'venta',
          precio: 150,
          tags: ['nuevo', 'tecnología'],
        },
        file: { filename: 'imagen-actualizada.jpg' },
        userId: (usuario._id as mongoose.Types.ObjectId).toString(),
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      jest.spyOn(anuncioUtils, 'isOwner').mockResolvedValue(true);
      const unlinkSpy = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

      await editAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(unlinkSpy).toHaveBeenCalledWith(
        path.join(__dirname, '../../public', 'imagen-original.jpg'),
      );
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Anuncio actualizado exitosamente',
          anuncio: expect.objectContaining({
            nombre: 'Anuncio Actualizado',
            imagen: '/images/imagen-actualizada.jpg',
            descripcion: 'Descripción actualizada',
            precio: 150,
            tags: ['nuevo', 'tecnología'],
          }),
        }),
      );
    });
  });

  describe('getAnunciosUsuario', () => {
    it('debería obtener los anuncios de un usuario específico', async () => {
      const usuario = new User({
        nombre: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        contraseña: 'password',
      });
      await usuario.save();

      const anuncios = [
        {
          nombre: 'Anuncio 1',
          descripcion: 'Descripción 1',
          imagen: 'imagen1.jpg',
          precio: 100,
          tipoAnuncio: 'venta',
          autor: usuario._id,
          slug: 'anuncio-1',
          fechaPublicacion: new Date(),
        },
        {
          nombre: 'Anuncio 2',
          descripcion: 'Descripción 2',
          imagen: 'imagen2.jpg',
          precio: 200,
          tipoAnuncio: 'búsqueda',
          autor: usuario._id,
          slug: 'anuncio-2',
          fechaPublicacion: new Date(),
        },
      ];
      await Anuncio.insertMany(anuncios);

      const mockRequest = {
        params: { nombreUsuario: 'UsuarioDePrueba' },
        query: { page: '1', limit: '10' },
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await getAnunciosUsuario(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.anuncios.length).toBe(2);
      expect(responseData.total).toBe(2);
      expect(responseData.page).toBe(1);
      expect(responseData.totalPages).toBe(1);
    });

    it('debería manejar el caso de usuario no encontrado', async () => {
      const mockRequest = {
        params: { nombreUsuario: 'UsuarioInexistente' },
        query: {},
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await getAnunciosUsuario(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });

    it('debería filtrar anuncios de usuario por nombre', async () => {
      const usuario = new User({
        nombre: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        contraseña: 'password',
      });
      await usuario.save();

      const anuncios = [
        {
          nombre: 'Anuncio 1',
          descripcion: 'Descripción 1',
          imagen: 'imagen1.jpg',
          precio: 100,
          tipoAnuncio: 'venta',
          autor: usuario._id,
          slug: 'anuncio-1',
          fechaPublicacion: new Date('2023-01-01'),
        },
        {
          nombre: 'Anuncio 2',
          descripcion: 'Descripción 2',
          imagen: 'imagen2.jpg',
          precio: 200,
          tipoAnuncio: 'búsqueda',
          autor: usuario._id,
          slug: 'anuncio-2',
          fechaPublicacion: new Date('2023-02-01'),
        },
      ];
      await Anuncio.insertMany(anuncios);

      const mockRequest = {
        params: { nombreUsuario: 'UsuarioDePrueba' },
        query: { nombre: 'Anuncio 1', page: '1', limit: '10' },
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await getAnunciosUsuario(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.anuncios.length).toBe(1);
      expect(responseData.anuncios[0].nombre).toBe('Anuncio 1');
    });

    it('debería ordenar anuncios de usuario', async () => {
      const usuario = new User({
        nombre: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        contraseña: 'password',
      });
      await usuario.save();

      const anuncios = [
        {
          nombre: 'Anuncio 1',
          descripcion: 'Descripción 1',
          imagen: 'imagen1.jpg',
          precio: 100,
          tipoAnuncio: 'venta',
          autor: usuario._id,
          slug: 'anuncio-1',
          fechaPublicacion: new Date('2023-01-01'),
        },
        {
          nombre: 'Anuncio 2',
          descripcion: 'Descripción 2',
          imagen: 'imagen2.jpg',
          precio: 200,
          tipoAnuncio: 'búsqueda',
          autor: usuario._id,
          slug: 'anuncio-2',
          fechaPublicacion: new Date('2023-02-01'),
        },
      ];
      await Anuncio.insertMany(anuncios);

      const mockRequest = {
        params: { nombreUsuario: 'UsuarioDePrueba' },
        query: { sort: 'asc', page: '1', limit: '10' },
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await getAnunciosUsuario(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.anuncios.length).toBe(2);
      expect(responseData.anuncios[0].nombre).toBe('Anuncio 1');
      expect(responseData.anuncios[1].nombre).toBe('Anuncio 2');
    });
  });

  // Pruebas para getAnuncio
  describe('getAnuncio', () => {
    it('debería obtener un anuncio por su slug', async () => {
      const usuario = new User({
        nombre: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        contraseña: 'password',
      });
      await usuario.save();

      const anuncio = await Anuncio.create({
        name: 'Anuncio de Prueba',
        description: 'Descripción de prueba',
        image: 'imagen.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario._id,
        slug: 'anuncio-de-prueba',
        publicationDate: new Date(),
      });

      const mockRequest = {
        params: { slug: 'anuncio-de-prueba' },
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await getAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalled();
      const responseData = mockJson.mock.calls[0][0];
      expect(responseData.result).toHaveProperty('nombre', 'Anuncio de Prueba');
      expect(responseData.result).toHaveProperty('slug', 'anuncio-de-prueba');
    });

    it('debería manejar el caso de anuncio no encontrado', async () => {
      const mockRequest = {
        params: { slug: 'anuncio-inexistente' },
      } as unknown as Request;

      const mockJson = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        json: mockJson,
      };

      await getAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200); // Aquí puedes ajustar según cómo manejes este caso en el controlador
      expect(mockJson).toHaveBeenCalledWith({ result: null });
    });
  });

  // Pruebas para deleteAnuncio
  describe('deleteAnuncio', () => {
    it('debería eliminar un anuncio si el usuario es el propietario', async () => {
      const usuario = await User.create({
        name: 'UsuarioDePrueba',
        email: 'usuario@prueba.com',
        password: 'password',
      });

      const anuncio = await Anuncio.create({
        name: 'Anuncio a eliminar',
        description: 'Descripción del anuncio a eliminar',
        image: 'imagen.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario._id,
        slug: 'anuncio-a-eliminar',
      });

      const userIdAsString = (usuario._id as mongoose.Types.ObjectId).toString();

      const mockRequest = {
        params: { anuncioId: anuncio._id },
        userId: userIdAsString,
      } as unknown as Request;

      const mockSend = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ send: mockSend });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        send: mockSend,
      };

      await deleteAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockSend).toHaveBeenCalledWith('Anuncio eliminado correctamente');

      const anuncioEliminado = await Anuncio.findById(anuncio._id);
      expect(anuncioEliminado).toBeNull();
    });

    it('debería devolver un error si el usuario no es el propietario', async () => {
      const usuario1 = await User.create({
        name: 'UsuarioDePrueba1',
        email: 'usuario1@prueba.com',
        password: 'password',
      });

      const usuario2 = await User.create({
        name: 'UsuarioDePrueba2',
        email: 'usuario2@prueba.com',
        password: 'password',
      });

      const anuncio = await Anuncio.create({
        name: 'Anuncio a eliminar',
        description: 'Descripción del anuncio a eliminar',
        image: 'imagen.jpg',
        price: 100,
        typeAdvert: 'venta',
        author: usuario1._id,
        slug: 'anuncio-a-eliminar',
      });

      const userIdAsString = (usuario2._id as mongoose.Types.ObjectId).toString();

      const mockRequest = {
        params: { anuncioId: anuncio._id },
        userId: userIdAsString,
      } as unknown as Request;

      const mockSend = jest.fn();
      const mockStatus = jest.fn().mockReturnValue({ send: mockSend });
      const mockResponse: Partial<Response> = {
        status: mockStatus,
        send: mockSend,
      };

      await deleteAnuncio(mockRequest, mockResponse as Response);

      expect(mockStatus).toHaveBeenCalledWith(403); // O 401 dependiendo de cómo manejes la autorización
      expect(mockSend).toHaveBeenCalledWith('No autorizado para eliminar este anuncio');

      const anuncioNoEliminado = await Anuncio.findById(anuncio._id);
      expect(anuncioNoEliminado).not.toBeNull();
    });
  });
});
