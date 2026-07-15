const crypto = require('crypto');

// 1. CONFIGURARE AES-256-GCM (Symmetric)
// În producție, cheia trebuie să fie salvată securizat în fișierul .env (exact 32 de caractere)
const AES_SECRET = 'o-cheie-secreta-de-32-caractere!'; 
const AES_KEY = crypto.scryptSync(AES_SECRET, 'salt-unic', 32);

// Criptează textul folosind AES-256-GCM
function encryptAES(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(12); // Vector de inițializare de 12 bytes (standard GCM)
  const cipher = crypto.createCipheriv('aes-256-gcm', AES_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag().toString('hex'); // Tag de autentificare pentru a preveni modificarea datelor

  // Returnăm IV-ul, tag-ul și textul criptat, separate prin două puncte
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

// Decriptează textul înapoi în plain-text
function decryptAES(encryptedData) {
  if (!encryptedData || !encryptedData.includes(':')) return encryptedData;

  try {
    const [ivHex, authTagHex, encryptedHex] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', AES_KEY, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Eroare la decriptarea AES:', error.message);
    return '[Eroare: Datele au fost compromise sau cheia este greșită]';
  }
}

// 2. CONFIGURARE ECC (Asymmetric - prime256v1 / SECP256R1)
// Generăm o pereche de chei ECC (în mod normal le generezi o singură dată și le salvezi)
const { privateKey, publicKey } = crypto.generateKeyPairSync('ec', {
  namedCurve: 'prime256v1', // Curba eliptică standard recomandată (P-256)
});

const privateKeyPEM = privateKey.export({ type: 'pkcs8', format: 'pem' });
const publicKeyPEM = publicKey.export({ type: 'spki', format: 'pem' });

// Semnează digital un string (ex: titlul temei) folosind cheia privată ECC
function signDataECC(dataString) {
  const sign = crypto.createSign('SHA256');
  sign.update(dataString);
  sign.end();
  return sign.sign(privateKeyPEM, 'hex');
}

// Verifică dacă semnătura este validă folosind cheia publică ECC
function verifySignatureECC(dataString, signature) {
  if (!signature) return false;
  const verify = crypto.createVerify('SHA256');
  verify.update(dataString);
  verify.end();
  return verify.verify(publicKeyPEM, signature, 'hex');
}

module.exports = {
  encryptAES,
  decryptAES,
  signDataECC,
  verifySignatureECC
};