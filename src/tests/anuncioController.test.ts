import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { getAnuncios, uploadImages } from '../controllers/anuncioController';
import Anuncio from '../models/Anuncio';
import Usuario from '../models/Usuario';
import { BadRequestError, AppError } from '../utils/errors';

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
    await Usuario.deleteMany({});
  });

  it('debería obtener una lista vacía de anuncios', async () => {
    const mockRequest = {
      query: {}
    } as unknown as Request;
    
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse: Partial<Response> = {
      status: mockStatus,
      json: mockJson
    };

    await getAnuncios(mockRequest, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      anuncios: [],
      total: 0,
      page: 1,
      totalPages: 0
    });
  });

  it('debería obtener anuncios con paginación', async () => {
    const usuario = new Usuario({
      nombre: 'UsuarioDePrueba', 
      email: 'usuario@prueba.com',
      contraseña: 'password'
    });
    await usuario.save();

    const anuncios = [
      { nombre: 'Anuncio 1', descripcion: 'Descripción 1', imagen: 'imagen1.jpg', precio: 100, tipoAnuncio: 'venta', autor: usuario._id, fechaPublicacion: new Date() },
      { nombre: 'Anuncio 2', descripcion: 'Descripción 2', imagen: 'imagen2.jpg', precio: 200, tipoAnuncio: 'búsqueda', autor: usuario._id, fechaPublicacion: new Date() },
      { nombre: 'Anuncio 3', descripcion: 'Descripción 3', imagen: 'imagen3.jpg', precio: 150, tipoAnuncio: 'venta', autor: usuario._id, fechaPublicacion: new Date() },
    ];
    await Anuncio.insertMany(anuncios);

    const mockRequest = {
      query: { page: '1', limit: '2' }
    } as unknown as Request;
    
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse: Partial<Response> = {
      status: mockStatus,
      json: mockJson
    };

    await getAnuncios(mockRequest, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalled();
    const responseData = mockJson.mock.calls[0][0];
    expect(responseData.anuncios.length).toBe(2);
    expect(responseData.total).toBe(3);
    expect(responseData.totalPages).toBe(2);
    responseData.anuncios.forEach((anuncio: any) => {
      expect(anuncio).toHaveProperty('autor');
      expect(anuncio.autor).toHaveProperty('nombre', 'UsuarioDePrueba');
    });
  });

  it('debería manejar errores', async () => {
    jest.spyOn(Anuncio, 'countDocuments').mockImplementationOnce(() => {
      throw new Error('Error de base de datos');
    });

    const mockRequest = {
      query: {}
    } as unknown as Request;
    
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse: Partial<Response> = {
      status: mockStatus,
      json: mockJson
    };

    await getAnuncios(mockRequest, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(500);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ 
        message: 'Error en el servidor', 
        error: 'Error de base de datos'
      })
    );
  });

  it('debería filtrar anuncios por nombre', async () => {
    const usuario = new Usuario({
      nombre: 'UsuarioDePrueba', 
      email: 'usuario@prueba.com',
      contraseña: 'password'
    });
    await usuario.save();

    const anuncios = [
      { nombre: 'Anuncio 1', descripcion: 'Descripción 1', imagen: 'imagen1.jpg', precio: 100, tipoAnuncio: 'venta', autor: usuario._id, fechaPublicacion: new Date() },
      { nombre: 'Anuncio 2', descripcion: 'Descripción 2', imagen: 'imagen2.jpg', precio: 200, tipoAnuncio: 'búsqueda', autor: usuario._id, fechaPublicacion: new Date() },
    ];
    await Anuncio.insertMany(anuncios);

    const mockRequest = {
      query: { nombre: 'Anuncio 1', page: '1', limit: '2' }
    } as unknown as Request;
    
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse: Partial<Response> = {
      status: mockStatus,
      json: mockJson
    };

    await getAnuncios(mockRequest, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalled();
    const responseData = mockJson.mock.calls[0][0];
    expect(responseData.anuncios.length).toBe(1);
    expect(responseData.anuncios[0].nombre).toBe('Anuncio 1');
  });

  it('debería filtrar anuncios por rango de precio', async () => {
    const usuario = new Usuario({
      nombre: 'UsuarioDePrueba', 
      email: 'usuario@prueba.com',
      contraseña: 'password'
    });
    await usuario.save();

    const anuncios = [
      { nombre: 'Anuncio 1', descripcion: 'Descripción 1', imagen: 'imagen1.jpg', precio: 100, tipoAnuncio: 'venta', autor: usuario._id, fechaPublicacion: new Date() },
      { nombre: 'Anuncio 2', descripcion: 'Descripción 2', imagen: 'imagen2.jpg', precio: 200, tipoAnuncio: 'búsqueda', autor: usuario._id, fechaPublicacion: new Date() },
    ];
    await Anuncio.insertMany(anuncios);

    const mockRequest = {
      query: { minPrecio: '150', page: '1', limit: '2' }
    } as unknown as Request;
    
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse: Partial<Response> = {
      status: mockStatus,
      json: mockJson
    };

    await getAnuncios(mockRequest, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalled();
    const responseData = mockJson.mock.calls[0][0];
    expect(responseData.anuncios.length).toBe(1);
    expect(responseData.anuncios[0].precio).toBe(200);
  });

  it('debería filtrar anuncios por tag', async () => {
    const usuario = new Usuario({
      nombre: 'UsuarioDePrueba', 
      email: 'usuario@prueba.com',
      contraseña: 'password'
    });
    await usuario.save();

    const anuncios = [
      { nombre: 'Anuncio 1', descripcion: 'Descripción 1', imagen: 'imagen1.jpg', precio: 100, tipoAnuncio: 'venta', tags: ['tag1'], autor: usuario._id, fechaPublicacion: new Date() },
      { nombre: 'Anuncio 2', descripcion: 'Descripción 2', imagen: 'imagen2.jpg', precio: 200, tipoAnuncio: 'búsqueda', tags: ['tag2'], autor: usuario._id, fechaPublicacion: new Date() },
    ];
    await Anuncio.insertMany(anuncios);

    const mockRequest = {
      query: { tag: 'tag1', page: '1', limit: '2' }
    } as unknown as Request;
    
    const mockJson = jest.fn();
    const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    const mockResponse: Partial<Response> = {
      status: mockStatus,
      json: mockJson
    };

    await getAnuncios(mockRequest, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalled();
    const responseData = mockJson.mock.calls[0][0];
    expect(responseData.anuncios.length).toBe(1);
    expect(responseData.anuncios[0].tags).toContain('tag1');
  });
});
