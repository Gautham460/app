/**
 * High-performance Client-Side Encryption using Web Crypto API.
 * This ensures "Zero-Knowledge" privacy where the server never sees plain-text health data.
 */

const ALGO = 'AES-GCM';

// Derive a key from a password-like string (e.g., userId + a local salt)
async function deriveKey(password) {
  const encoder = new TextEncoder();
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('emotional-energy-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(text, password) {
  if (!text) return text;
  const key = await deriveKey(password);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  
  const encrypted = await window.crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    encoded
  );

  // Combine IV and Encrypted Data for storage
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

export async function decryptData(encodedData, password) {
  if (!encodedData) return encodedData;
  try {
    const key = await deriveKey(password);
    const combined = new Uint8Array(atob(encodedData).split('').map(c => c.charCodeAt(0)));
    
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGO, iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return "[Encrypted Data]";
  }
}
