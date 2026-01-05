import { createClient } from 'redis';

console.log('Connecting to Redis server...');
console.log('Host:', process.env.REDIS_SOCKET_HOST);
console.log('Username:', process.env.REDIS_USERNAME ? 'Provided' : 'Not Provided');
console.log('SecretKey:', process.env.REDIS_SECRETACCESSKEY ? '********' : 'Not Provided');

const redisClient = createClient({
  username: String(process.env.REDIS_USERNAME) ? String(process.env.REDIS_USERNAME) : undefined,
  password: String(process.env.REDIS_SECRETACCESSKEY)
    ? String(process.env.REDIS_SECRETACCESSKEY)
    : undefined,
  socket: {
    host: String(process.env.REDIS_SOCKET_HOST)
      ? String(process.env.REDIS_SOCKET_HOST)
      : 'localhost',
    port: Number(process.env.REDIS_SOCKET_PORT) ? Number(process.env.REDIS_SOCKET_PORT) : 6379,
  },
});

async function connectToRedis() {
  try {
    await redisClient.connect();
    console.log('Connected to Redis server');
  } catch (error) {
    console.error('Redis connection error:', error);
  }
}

connectToRedis();

export default redisClient;
