const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { decryptAES, verifySignatureECC } = require('../utils/cryptoUtils');

const forgotPasswordLimiter = (req, res, next) => next();

/**
 * MIDDLEWARE DE SECURITATE HIBRID (AES/ECC + Fallback JSON)
 */
const secureAuthPayload = (req, res, next) => {
  try {
    const { encryptedData, signature, email, password } = req.body;

    // SCENARIU A: Datele sunt criptate (Securitate Maximă)
    if (encryptedData) {
      if (signature) {
        const isDataAuthentic = verifySignatureECC(encryptedData, signature);
        if (!isDataAuthentic) {
          return res.status(401).json({
            message: 'Atac detectat: Semnătura ECC este invalidă. Datele au fost compromise!'
          });
        }
      }

      const decryptedText = decryptAES(encryptedData);

      if (!decryptedText || decryptedText.startsWith('[Eroare:')) {
        return res.status(400).json({
          message: 'Nu s-au putut decripta datele de autentificare.'
        });
      }

      req.body = JSON.parse(decryptedText);
      return next();
    }

    // SCENARIU B: Date necriptate (Frontend standard)
    if (email && password) {
      return next();
    }

    // SCENARIU C: Niciun format valid
    return res.status(400).json({
      message: 'Payload invalid: Trimiterea necesită date criptate (encryptedData) sau câmpurile email/password.'
    });

  } catch (error) {
    return res.status(500).json({
      message: 'Eroare la procesarea stratului de securitate.',
      error: error.message
    });
  }
};

// Rute
router.post('/register', secureAuthPayload, authController.register);
router.post('/login', secureAuthPayload, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify', authController.verify);

module.exports = router;