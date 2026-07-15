const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const redisClient = require('../config/redis');

const createLimiter = (windowMs, max, message) => {
    return rateLimit({
        store: new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
        }),
        windowMs, // Timpul de monitorizare (ex: 15 minute)
        max,      // Numărul maxim de cereri permise în acest interval
        message: { message },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

// Configurații de limitare conform regulamentului de securitate
const loginLimiter = createLimiter(15 * 60 * 1000, 5, 'Prea multe încercări. Încearcă din nou în 15 minute.');
const registerLimiter = createLimiter(60 * 60 * 1000, 10, 'Prea multe conturi create. Încearcă din nou peste o oră.');
const forgotPasswordLimiter = createLimiter(60 * 60 * 1000, 3, 'Prea multe cereri de resetare. Încearcă din nou peste o oră.');

module.exports = { loginLimiter, registerLimiter, forgotPasswordLimiter };