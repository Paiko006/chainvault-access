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
export async function getVaultKey(addressOrSeed: string, signMessage?: (payload: any) => Promise<any>): Promise<CryptoKey> {
  let seedBase64: string | null = null;
  const isDirectSeed = addressOrSeed.length > 40 && !addressOrSeed.startsWith("0x");

  if (isDirectSeed) {
    seedBase64 = addressOrSeed;
  } else {
    const storageKey = `vault_seed_${addressOrSeed}`;
    seedBase64 = localStorage.getItem(storageKey);

    if (!seedBase64) {
      if (signMessage) {
        try {
          const response = await signMessage({
            message: "Welcome to ShelbySecure!\n\nSign this message to securely unlock your decentralized data vault and generate your encryption key.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.",
            nonce: "1",
          });
          
          // Hash the signature to derive 32 bytes of entropy for the seed
          const sigData = new TextEncoder().encode(response.signature || response.fullMessage || "fallback-sig-entropy");
          const hashBuffer = await window.crypto.subtle.digest("SHA-256", sigData);
          
          seedBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
          localStorage.setItem(storageKey, seedBase64);
        } catch (err: any) {
          throw new Error("Vault signature required. Please approve the signing request to unlock.");
        }
      } else {
        throw new Error("Vault is locked on this device. Signature function required to generate the key.");
      }
    }
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
      salt: new TextEncoder().encode(isDirectSeed ? "shared_vault" : addressOrSeed), // Use generic salt for direct seeds
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
