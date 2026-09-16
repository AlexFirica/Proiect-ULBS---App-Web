// queue/compiler.queue.js
const { Queue } = require('bullmq');
const redisConnection = require('../config/redis'); // Import conexiune unificată

const compilerQueue = new Queue('compilerQueue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: 5000
  }
});

module.exports = { compilerQueue };