const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { decryptAES, verifySignatureECC } = require('../utils/cryptoUtils'); 

// Placeholder pentru limiter (pentru a preveni prăbușirea serverului în caz că nu e importat)
const forgotPasswordLimiter = (req, res, next) => next(); 

/**
 * MIDDLEWARE DE SECURITATE (AES & ECC)
 */
const secureAuthPayload = (req, res, next) => {
  try {
    const { encryptedData, signature } = req.body;

    if (!encryptedData) {
      return res.status(400).json({ 
        message: 'Securitate încălcată: Datele trimise nu sunt criptate.' 
      });
    }

    if (signature) {
      const isDataAuthentic = verifySignatureECC(encryptedData, signature);
      if (!isDataAuthentic) {
        return res.status(401).json({ 
          message: 'Atac detectat: Semnătura ECC este invalidă. Datele au fost compromise!' 
        });
      }
    }

    const decryptedText = decryptAES(encryptedData);

    if (decryptedText.startsWith('[Eroare:')) {
      return res.status(400).json({ 
        message: 'Nu s-au putut decripta datele de autentificare.' 
      });
    }

    const credentials = JSON.parse(decryptedText);
    req.body = credentials; 

    next(); 
  } catch (error) {
    return res.status(500).json({ 
      message: 'Eroare la procesarea stratului de securitate AES/ECC.', 
      error: error.message 
    });
  }
};

// Rute securizate prin stratul AES / ECC
router.post('/register', secureAuthPayload, authController.register);
router.post('/login', secureAuthPayload, authController.login);

// Restul rutelor standard (folosesc funcțiile acum exportate corect)
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/resend-verification', authController.resendVerification);
router.post('/forgot-password', forgotPasswordLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify', authController.verify);

module.exports = router;