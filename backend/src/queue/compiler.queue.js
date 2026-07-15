const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// Conexiunea la instanța locală sau cloud de Redis
const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const compilerQueue = new Queue('compilerQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3, // Reîncercări în caz de crash network
    backoff: 5000 // Așteaptă 5 secunde înainte de reîncercare
  }
});

module.exports = { compilerQueue, redisConnection };