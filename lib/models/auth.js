import { getClient } from '../mongodb';
import crypto from 'crypto';

const COLLECTION_NAME = 'auth';

// Hash PIN using SHA-256
function hashPin(pin) {
  return crypto.createHash('sha256').update(pin).digest('hex');
}

// Encrypt security answer using AES-256
function encryptAnswer(answer) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  
  let encrypted = cipher.update(answer.toLowerCase().trim(), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return {
    encrypted,
    iv: iv.toString('hex')
  };
}

// Decrypt security answer
function decryptAnswer(encrypted, ivHex) {
  const algorithm = 'aes-256-cbc';
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key-change-in-production', 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export async function getAuth() {
  const client = await getClient();
  const db = client.db();
  const auth = await db.collection(COLLECTION_NAME).findOne({});
  return auth;
}

export async function setPin(pin, securityQuestion, securityAnswer) {
  const client = await getClient();
  const db = client.db();
  
  const hashedPin = hashPin(pin);
  const { encrypted, iv } = encryptAnswer(securityAnswer);
  
  const result = await db.collection(COLLECTION_NAME).updateOne(
    {},
    {
      $set: {
        pinHash: hashedPin,
        securityQuestion,
        securityAnswerEncrypted: encrypted,
        securityAnswerIv: iv,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
  
  return result;
}

export async function verifyPin(pin) {
  const auth = await getAuth();
  if (!auth || !auth.pinHash) {
    return false;
  }
  
  const hashedPin = hashPin(pin);
  return hashedPin === auth.pinHash;
}

export async function verifySecurityAnswer(answer) {
  const auth = await getAuth();
  if (!auth || !auth.securityAnswerEncrypted) {
    return false;
  }
  
  const decrypted = decryptAnswer(auth.securityAnswerEncrypted, auth.securityAnswerIv);
  return decrypted === answer.toLowerCase().trim();
}

export async function resetPin(newPin, securityAnswer) {
  const isValid = await verifySecurityAnswer(securityAnswer);
  if (!isValid) {
    throw new Error('Invalid security answer');
  }
  
  const client = await getClient();
  const db = client.db();
  
  const hashedPin = hashPin(newPin);
  
  const result = await db.collection(COLLECTION_NAME).updateOne(
    {},
    {
      $set: {
        pinHash: hashedPin,
        updatedAt: new Date()
      }
    }
  );
  
  return result;
}

export async function isPinSet() {
  const auth = await getAuth();
  return !!(auth && auth.pinHash);
}
