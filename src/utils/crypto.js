import CryptoJS from 'crypto-js';

// ----------------------------------------------------------------------
// NEXT_PUBLIC_CRYPTO_SECRET is intentionally a browser-accessible key used
// solely for the browser ↔ Next.js proxy channel (same-origin HTTPS).
// It adds a payload-level encryption layer on top of TLS so raw JSON is
// never visible in plaintext even if TLS is terminated at a CDN edge.
//
// The actual backend URL and CRYPTO_SECRET (server-only, never bundled)
// are kept exclusively in the Next.js server environment.
// ----------------------------------------------------------------------

const ENCRYPTION_ENABLED = process.env.NEXT_PUBLIC_ENABLE_ENCRYPTION === 'true';

const SECRET_KEY = process.env.NEXT_PUBLIC_CRYPTO_SECRET;

if (ENCRYPTION_ENABLED && !SECRET_KEY) {
  if (typeof window === 'undefined') {
    throw new Error('[crypto] NEXT_PUBLIC_CRYPTO_SECRET is not set. Cannot enable encryption.');
  } else {
    console.warn(
      '[crypto] Encryption enabled but no client key found — payload encryption disabled.'
    );
  }
}

// ----------------------------------------------------------------------

/**
 * Encrypt a JSON-serializable payload using AES-256.
 * Returns a Base64-encoded cipher string.
 */
export function encryptPayload(data) {
  if (!ENCRYPTION_ENABLED || !SECRET_KEY || data == null) return data;

  const jsonStr = typeof data === 'string' ? data : JSON.stringify(data);
  return CryptoJS.AES.encrypt(jsonStr, SECRET_KEY).toString();
}

// ----------------------------------------------------------------------

/**
 * Decrypt a Base64-encoded AES cipher string back into a parsed object.
 */
export function decryptPayload(cipherText) {
  if (!ENCRYPTION_ENABLED || !SECRET_KEY || !cipherText) return cipherText;

  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedStr);
  } catch (error) {
    console.error('Decryption failed, returning raw data:', error);
    return cipherText;
  }
}

// ----------------------------------------------------------------------

/**
 * Check if a response body is an encrypted envelope from the proxy.
 */
export function isEncryptedResponse(data) {
  return (
    ENCRYPTION_ENABLED && SECRET_KEY && data && typeof data === 'object' && data._encrypted === true
  );
}

// ----------------------------------------------------------------------

export { ENCRYPTION_ENABLED };
