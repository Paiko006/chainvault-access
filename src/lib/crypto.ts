/**
 * Crypto Utility for Private Vault
 * Uses Web Crypto API (AES-GCM) for client-side encryption.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // Standard for AES-GCM
const KEY_USAGE: KeyUsage[] = ["encrypt", "decrypt"];

/**
 * Gets or creates a unique encryption key for the given wallet address.
 * Stores a random seed in localStorage to ensure persistence across sessions.
 */
export async function getVaultKey(address: string): Promise<CryptoKey> {
  const storageKey = `vault_seed_${address}`;
  let seedBase64 = localStorage.getItem(storageKey);

  if (!seedBase64) {
    const randomSeed = window.crypto.getRandomValues(new Uint8Array(32));
    seedBase64 = btoa(String.fromCharCode(...randomSeed));
    localStorage.setItem(storageKey, seedBase64);
  }

  const seed = new Uint8Array(
    atob(seedBase64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );

  // Import the seed as a raw key
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    seed,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  // Derive the actual AES-GCM key using PBKDF2 for extra security
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(address), // Use address as salt
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    KEY_USAGE
  );
}

/**
 * Encrypts a file buffer. Returns a new Blob containing [IV][Ciphertext].
 */
export async function encryptData(data: ArrayBuffer, key: CryptoKey): Promise<Blob> {
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = await window.crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  // Combine IV and Ciphertext for storage
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);

  return new Blob([combined]);
}

/**
 * Decrypts an encrypted Blob. Expects [IV][Ciphertext] format.
 */
export async function decryptData(encryptedBlob: Blob, key: CryptoKey): Promise<Blob> {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const iv = arrayBuffer.slice(0, IV_LENGTH);
  const ciphertext = arrayBuffer.slice(IV_LENGTH);

  const decrypted = await window.crypto.subtle.decrypt(
    { name: ALGORITHM, iv: new Uint8Array(iv) },
    key,
    ciphertext
  );

  return new Blob([decrypted]);
}

/**
 * Helper to identify encrypted files in the vault.
 */
export const ENCRYPTION_PREFIX = "shelbysecure/";
