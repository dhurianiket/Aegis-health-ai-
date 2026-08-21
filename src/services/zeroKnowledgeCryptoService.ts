/**
 * zeroKnowledgeCryptoService.ts — WebCrypto AES-256-GCM Zero-Knowledge Vault Engine
 * Leverages browser-native `window.crypto.subtle` API for hardware-backed data protection:
 * 1. PBKDF2 Key Derivation: Derives a 256-bit AES key from user passphrase using 100,000 iterations & SHA-256 salt.
 * 2. AES-256-GCM Encryption: Encrypts payloads with 12-byte random IVs and 128-bit GCM authentication tags.
 * 3. Zero-Knowledge Invariant: Passphrases never leave the client browser.
 */

export interface EncryptedPayload {
  ciphertext: string; // Base64 encoded AES-GCM ciphertext
  salt: string;       // Base64 encoded 16-byte PBKDF2 salt
  iv: string;         // Base64 encoded 12-byte GCM initialization vector
  algorithm: string;  // 'AES-256-GCM'
  timestamp: string;
}

/**
 * Converts ArrayBuffer to Base64 string
 */
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to Uint8Array
 */
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-GCM 256-bit CryptoKey from a passphrase and salt using PBKDF2
 */
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts a plaintext string using a user passphrase (AES-256-GCM)
 */
export async function encryptZeroKnowledge(
  plaintext: string,
  passphrase: string
): Promise<EncryptedPayload> {
  if (!passphrase) throw new Error('Master passphrase is required for Zero-Knowledge encryption.');

  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const key = await deriveKey(passphrase, salt);
  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    algorithm: 'AES-256-GCM',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Decrypts an EncryptedPayload using the user passphrase (AES-256-GCM)
 */
export async function decryptZeroKnowledge(
  payload: EncryptedPayload,
  passphrase: string
): Promise<string> {
  if (!passphrase) throw new Error('Master passphrase is required for decryption.');

  const dec = new TextDecoder();
  const salt = base64ToBuffer(payload.salt);
  const iv = base64ToBuffer(payload.iv);
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const key = await deriveKey(passphrase, salt);

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      ciphertext
    );
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('Decryption failed: Incorrect master passphrase or corrupted payload.');
  }
}

/**
 * Generates a SHA-256 hash digest of a passphrase for authentication verification
 */
export async function hashPassphrase(passphrase: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex ? base64ToBuffer(saltHex) : window.crypto.getRandomValues(new Uint8Array(16));
  
  const combined = new Uint8Array(salt.length + enc.encode(passphrase).length);
  combined.set(salt, 0);
  combined.set(enc.encode(passphrase), salt.length);

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', combined);
  return {
    hash: bufferToBase64(hashBuffer),
    salt: bufferToBase64(salt.buffer),
  };
}
