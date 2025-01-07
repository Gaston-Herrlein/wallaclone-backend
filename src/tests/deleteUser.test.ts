import request from 'supertest';
import mongoose from 'mongoose';
import app from '../app';
import User from '../models/Usuario';
import Anuncio from '../models/Anuncio';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

describe('Delete User Account', () => {
  let testUser: any;
  let testToken: string;

  beforeAll(async () => {
    // Conectar a la base de datos de prueba
    await mongoose.connect(
      process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/wallaclone_test',
    );
  });

  afterAll(async () => {
    // Cerrar la conexión a la base de datos
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Crear un usuario de prueba
    testUser = await User.create({
      name: 'TestUser',
      email: 'test@example.com',
      password: 'password123',
    });

    // Crear un anuncio de prueba asociado al usuario
    await Anuncio.create({
      name: 'Test Anuncio',
      image: 'test.jpg',
      description: 'Test description',
      price: 100,
      typeAdvert: 'venta',
      tags: ['test'],
      author: testUser._id,
      slug: 'test-anuncio',
    });

    // Generar token JWT para el usuario de prueba
    testToken = jwt.sign({ userId: testUser._id }, JWT_SECRET);
  });

  afterEach(async () => {
    // Limpiar la base de datos después de cada prueba
    await User.deleteMany({});
    await Anuncio.deleteMany({});
  });

  it('should delete user account and associated data', async () => {
    const response = await request(app)
      .delete(`/api/users/${testUser._id}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Cuenta de usuario eliminada con éxito');

    // Verificar que el usuario ya no existe en la base de datos
    const deletedUser = await User.findById(testUser._id);
    expect(deletedUser).toBeNull();

    // Verificar que los anuncios asociados al usuario han sido eliminados
    const userAnuncios = await Anuncio.find({ author: testUser._id });
    expect(userAnuncios.length).toBe(0);
  });

  it('should return 404 if user not found', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/api/users/${nonExistentId}`)
      .set('Authorization', `Bearer ${testToken}`);

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('Usuario no encontrado');
  });

  it('should return 401 if no token provided', async () => {
    const response = await request(app).delete(`/api/users/${testUser._id}`);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('No token provided');
  });
});
