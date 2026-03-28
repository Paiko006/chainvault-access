import nacl from "tweetnacl";

/**
 * Crypto Utility for Private Vault
 * Uses Web Crypto API (AES-GCM) for client-side encryption.
 * Uses TweetNaCl (Curve25519) for asymmetric Wallet-to-Wallet encryption.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // Standard for AES-GCM
const KEY_USAGE: KeyUsage[] = ["encrypt", "decrypt"];

/**
 * Normalizes an Aptos address to a full 64-character hex string (excluding 0x).
 */
export function normalizeAptosAddress(addr: string): string {
  let clean = addr.toLowerCase();
  if (clean.startsWith("0x")) {
    clean = clean.substring(2);
  }
  return "0x" + clean.padStart(64, "0");
}

export interface VaultKeys {
  aesKey: CryptoKey;
  naclKeyPair: nacl.BoxKeyPair;
}

/**
 * Gets or creates a unique encryption key for the given wallet address.
 * Stores a random seed in localStorage to ensure persistence across sessions.
 */
export async function getVaultKeys(addressOrSeed: string, signMessage?: (payload: unknown) => Promise<unknown>): Promise<VaultKeys> {
  const normalizedInput = addressOrSeed.startsWith("0x") ? normalizeAptosAddress(addressOrSeed) : addressOrSeed;
  let seedBase64: string | null = null;
  const isDirectSeed = normalizedInput.length > 40 && !normalizedInput.startsWith("0x");

  if (isDirectSeed) {
    seedBase64 = addressOrSeed;
  } else {
    const storageKey = `vault_seed_${normalizedInput}`;
    seedBase64 = localStorage.getItem(storageKey);

    if (!seedBase64) {
      if (signMessage) {
        try {
          const response = await signMessage({
            message: "Welcome to ShelbySecure!\n\nSign this message to securely unlock your decentralized data vault and generate your encryption key.\n\nThis request will not trigger a blockchain transaction or cost any gas fees.",
            nonce: "1",
          }) as { signature?: string, fullMessage?: string };
          
          // Hash the signature to derive 32 bytes of entropy for the seed
          // Ensure we handle both string (hex) and Uint8Array signatures consistently
          const rawSig = response.signature || response.fullMessage || "fallback-sig-entropy";
          const sigData = typeof rawSig === "string" 
            ? new TextEncoder().encode(rawSig.toLowerCase()) // Normalize hex strings to lowercase
            : new Uint8Array(rawSig as ArrayBuffer);
            
          const hashBuffer = await window.crypto.subtle.digest("SHA-256", sigData);
          
          seedBase64 = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
          localStorage.setItem(storageKey, seedBase64);
        } catch (err: unknown) {
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
  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode(isDirectSeed ? "shared_vault" : normalizedInput), // Use generic salt for direct seeds
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: ALGORITHM, length: 256 },
    false,
    KEY_USAGE
  );

  // Generate TweetNaCl Box Keypair (Curve25519) from the same 32-byte seed
  const naclKeyPair = nacl.box.keyPair.fromSecretKey(seed);

  return { aesKey, naclKeyPair };
}

export async function getVaultKey(addressOrSeed: string, signMessage?: (payload: unknown) => Promise<unknown>): Promise<CryptoKey> {
  const keys = await getVaultKeys(addressOrSeed, signMessage);
  return keys.aesKey;
}

// Convert Uint8Array to Base64
export function bytesToBase64(arr: Uint8Array): string {
  return btoa(String.fromCharCode(...arr));
}

// Convert Base64 to Uint8Array
export function base64ToBytes(str: string): Uint8Array {
  return new Uint8Array(atob(str).split("").map((c) => c.charCodeAt(0)));
}

/**
 * Encrypt a File Encryption Key (FEK) for a specific recipient using their public key.
 */
export function encryptFEK(fek: Uint8Array, senderPrivateKey: Uint8Array, recipientPublicKey: Uint8Array): { encryptedFek: string; nonce: string } {
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const encrypted = nacl.box(fek, nonce, recipientPublicKey, senderPrivateKey);
  return {
    encryptedFek: bytesToBase64(encrypted),
    nonce: bytesToBase64(nonce),
  };
}

/**
 * Decrypt a File Encryption Key (FEK) that was encrypted by a sender for the receiver.
 */
export function decryptFEK(encryptedFekStr: string, nonceStr: string, senderPublicKey: Uint8Array, receiverPrivateKey: Uint8Array): Uint8Array | null {
  const encrypted = base64ToBytes(encryptedFekStr);
  const nonce = base64ToBytes(nonceStr);
  return nacl.box.open(encrypted, nonce, senderPublicKey, receiverPrivateKey);
}


export async function importFEK(rawKey: Uint8Array): Promise<CryptoKey> {
  return await window.crypto.subtle.importKey(
    "raw",
    rawKey.buffer as ArrayBuffer,
    ALGORITHM,
    true,
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
 * Interface for Asymmetric Encryption Header
 */
export interface AsymmetricHeader {
  uploaderPubKey: string; // Base64
  feks: Record<string, { fek: string; nonce: string }>; // Address -> Encrypted FEK
}

/**
 * Parses Asymmetric payload format and decrypts it.
 */
export async function decryptDataAsymmetric(encryptedBlob: Blob, receiverAddress: string, keys: VaultKeys): Promise<Blob> {
  const arrayBuffer = await encryptedBlob.arrayBuffer();
  const dataview = new DataView(arrayBuffer);
  
  // Read header length (4 bytes)
  const headerLength = dataview.getInt32(0, true);
  
  // Read JSON Header
  const headerBytes = new Uint8Array(arrayBuffer.slice(4, 4 + headerLength));
  const headerJson = new TextDecoder().decode(headerBytes);
  const header: AsymmetricHeader = JSON.parse(headerJson);
  
  const receiverData = header.feks[normalizeAptosAddress(receiverAddress)];
  if (!receiverData) {
    throw new Error("You do not have permission to decrypt this file.");
  }

  // Decrypt FEK
  const uploaderPubKeyUint = base64ToBytes(header.uploaderPubKey);
  const decryptedFek = decryptFEK(
    receiverData.fek,
    receiverData.nonce,
    uploaderPubKeyUint,
    keys.naclKeyPair.secretKey
  );

  if (!decryptedFek) {
    throw new Error("Failed to decrypt asymmetric payload. Keys do not match.");
  }

  // Import FEK and decrypt the actual blob
  const fekKey = await importFEK(decryptedFek);
  const realFileBuffer = arrayBuffer.slice(4 + headerLength);
  
  return await decryptData(new Blob([realFileBuffer]), fekKey);
}

/**
 * Combines JSON logic to create Asymmetric chunked Payload.
 */
export async function encryptDataAsymmetric(data: ArrayBuffer, header: AsymmetricHeader, fekKey: CryptoKey): Promise<Blob> {
  const encryptedFile = await encryptData(data, fekKey);
  const encryptedFileBuffer = await encryptedFile.arrayBuffer();
  
  const headerJson = JSON.stringify(header);
  const headerBytes = new TextEncoder().encode(headerJson);
  const headerLength = headerBytes.length;

  const combined = new Uint8Array(4 + headerLength + encryptedFileBuffer.byteLength);
  
  // 1. Length (4 bytes, little endian)
  const view = new DataView(combined.buffer);
  view.setInt32(0, headerLength, true);

  // 2. JSON Header bytes
  combined.set(headerBytes, 4);

  // 3. Encrypted Data Blob
  combined.set(new Uint8Array(encryptedFileBuffer), 4 + headerLength);

  return new Blob([combined]);
}

/**
 * Helper to identify encrypted files in the vault.
 */
export const ENCRYPTION_PREFIX = "shelbysecure/";
