export const BLOBS_STORAGE_KEY = "chainvault_blobs";

export interface StoredBlob {
  blobName: string;
  uploadedAt: number;
  sizeBytes: number;
  ownerAddress: string;
  expirationMicros: number;
  sharedWith: string[]; // List of wallet addresses with access
}

export function getStoredBlobs(): StoredBlob[] {
  try {
    return JSON.parse(localStorage.getItem(BLOBS_STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveStoredBlobs(blobs: StoredBlob[]) {
  localStorage.setItem(BLOBS_STORAGE_KEY, JSON.stringify(blobs));
}
