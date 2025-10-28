import { createClient } from 'redis';

console.log('Connecting to Redis server...');
console.log('Host:', process.env.REDIS_SOCKET_HOST);
console.log('Username:', process.env.REDIS_USERNAME ? 'Provided' : 'Not Provided');
console.log('SecretKey:', process.env.REDIS_SECRETACCESSKEY ? '********' : 'Not Provided');

const redisClient = createClient({
  username: String(process.env.REDIS_USERNAME),
  password: String(process.env.REDIS_SECRETACCESSKEY),
  socket: {
    host: String(process.env.REDIS_SOCKET_HOST),
    port: Number(process.env.REDIS_SOCKET_PORT),
  },
});

redisClient.on('error', (err) => console.log('Redis Client Error', err)).connect();

export default redisClient;
