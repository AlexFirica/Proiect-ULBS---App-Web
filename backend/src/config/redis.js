const Redis = require('ioredis');
require('dotenv').config();

const redisConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null // BullMQ cere în mod obligatoriu această setare
});

redisConnection.on('connect', () => {
  console.log("🔴 Conexiunea la Redis a fost stabilită cu succes.");
});

redisConnection.on('error', (err) => {
  console.error("❌ Eroare de conexiune la Redis:", err.message);
});

module.exports = redisConnection;