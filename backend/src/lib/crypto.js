import crypto from 'crypto';

// Provider keys (OpenAI/Gemini/Claude keys customers give us) must never be
// stored in plaintext. We encrypt with AES-256-GCM using a server-side secret.
// In production this secret should come from a KMS/secrets manager, not .env.

const ALGORITHM = 'aes-256-gcm';
const SECRET = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'dev_only_fallback').digest();

export function encrypt(plainText) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // Store iv + authTag + ciphertext together, base64-encoded
  return Buffer.concat([iv, authTag, encrypted]).toString('base64');
}

export function decrypt(encoded) {
  const buf = Buffer.from(encoded, 'base64');
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
