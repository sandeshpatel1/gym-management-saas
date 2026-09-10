const crypto = require('crypto');

const ALGO = 'aes-256-gcm';

const getKey = () => {
  const secret = process.env.CREDENTIALS_ENCRYPTION_KEY;
  if (!secret) throw new Error('CREDENTIALS_ENCRYPTION_KEY is not set in .env');
  return crypto.createHash('sha256').update(secret).digest(); // 32 bytes for AES-256
};

// Encrypts a plaintext credential (API key/secret) for storage in Mongo.
// Never store gateway secrets unencrypted - a DB dump would leak every
// gym's live payment credentials otherwise.
const encrypt = (plainText) => {
  if (plainText === undefined || plainText === null || plainText === '') return '';
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
};

const decrypt = (payload) => {
  if (!payload) return '';
  const raw = Buffer.from(payload, 'base64');
  const iv = raw.subarray(0, 12);
  const authTag = raw.subarray(12, 28);
  const encrypted = raw.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
};

// For displaying "you have a key saved" in the UI without ever sending the
// real secret back to the browser.
const mask = (plainText) => {
  if (!plainText) return '';
  const s = String(plainText);
  if (s.length <= 4) return '••••';
  return `${'•'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
};

module.exports = { encrypt, decrypt, mask };