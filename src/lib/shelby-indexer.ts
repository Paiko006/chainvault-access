/**
 * Shelby Indexer Utility
 * Fetches blob metadata and account statistics directly from the Shelby GraphQL Indexer.
 */

const SHELBY_INDEXER_URL = "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql";
export const PUBLIC_SHELBY_API_KEY = "AG-7FPFEZSPINUP4F7HKVSIO1ZPOEDZ8E5WN";

export interface ShelbyBlob {
  blob_name: string;
  size: string; // numeric in GraphQL returns as string
  created_at: string; // numeric string (microseconds)
  expires_at: string; // numeric string (microseconds)
  owner: string;
  permissions?: { sharee: string }[];
}

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

/**
 * Helper for GraphQL fetch with error handling and API key trimming
 */
async function performQuery(query: string, variables: any, apiKey?: string): Promise<any> {
  const rawApiKey = apiKey || localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || PUBLIC_SHELBY_API_KEY;
  const effectiveApiKey = rawApiKey?.trim() || "";

  try {
    const response = await fetch(SHELBY_INDEXER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(effectiveApiKey ? { 
          "Authorization": `Bearer ${effectiveApiKey}`,
          "x-api-key": effectiveApiKey 
        } : {})
      },
      body: JSON.stringify({ query, variables })
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.data;
  } catch (err) {
    console.error("[ShelbyIndexer] Query error:", err);
    return null;
  }
}

/**
 * Fetches all active (not deleted) blobs owned by a specific address.
 * Retries with both padded and shortened address formats for maximum resilience.
 */
export async function fetchAccountBlobs(owner: string, apiKey?: string): Promise<ShelbyBlob[]> {
  const query = `
    query GetUserBlobs($owner: String!) {
      blobs(where: { owner: { _eq: $owner } }, order_by: { created_at: desc }) {
        blob_name
        size
        created_at
        expires_at
        owner
        permissions {
          sharee
        }
      }
    }
  `;

  // Try 1: Padded
  const padded = normalizeAptosAddress(owner);
  const data1 = await performQuery(query, { owner: padded }, apiKey);
  if (data1?.blobs?.length > 0) return data1.blobs;

  // Try 2: Shortened
  const shortened = "0x" + padded.substring(2).replace(/^0+/, "");
  const finalShortened = shortened === "0x" ? "0x0" : shortened;
  if (finalShortened !== padded) {
    const data2 = await performQuery(query, { owner: finalShortened }, apiKey);
    if (data2?.blobs?.length > 0) return data2.blobs;
  }

  return [];
}

/**
 * Fetches all blobs where the given address has been granted access.
 */
export async function fetchSharedBlobs(sharee: string, apiKey?: string): Promise<ShelbyBlob[]> {
  const query = `
    query GetSharedBlobs($sharee: String!) {
      blobs(where: { permissions: { sharee: { _eq: $sharee } } }, order_by: { created_at: desc }) {
        blob_name
        size
        created_at
        expires_at
        owner
        permissions {
          sharee
        }
      }
    }
  `;

  // Try 1: Padded
  const padded = normalizeAptosAddress(sharee);
  const data1 = await performQuery(query, { sharee: padded }, apiKey);
  if (data1?.blobs?.length > 0) return data1.blobs;

  // Try 2: Shortened
  const shortened = "0x" + padded.substring(2).replace(/^0+/, "");
  const finalShortened = shortened === "0x" ? "0x0" : shortened;
  if (finalShortened !== padded) {
    const data2 = await performQuery(query, { sharee: finalShortened }, apiKey);
    if (data2?.blobs?.length > 0) return data2.blobs;
  }

  return [];
}

/**
 * Fetches raw blob data from the Shelby network for decryption.
 */
export async function fetchBlobData(blobName: string, owner: string): Promise<Blob> {
  const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || PUBLIC_SHELBY_API_KEY;
  const effectiveApiKey = apiKey?.trim() || "";
  
  let cleanBlobName = blobName;
  if (cleanBlobName.includes('/')) {
    cleanBlobName = cleanBlobName.split('/').slice(1).join('/');
  }

  const normalizedOwner = normalizeAptosAddress(owner);
  const encodedName = cleanBlobName.split('/').map(p => encodeURIComponent(p)).join('/');
  const url = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${normalizedOwner}/${encodedName}`;

  const response = await fetch(url, {
    headers: {
      "Authorization": `Bearer ${effectiveApiKey}`,
      "x-api-key": effectiveApiKey
    }
  });

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}): ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Fetches the user's storage quota from the Shelby network.
 */
export async function syncUserQuota(owner: string, apiKey?: string): Promise<number | null> {
  try {
    const blobs = await fetchAccountBlobs(owner, apiKey);
    const quotaBlobs = blobs.filter(b => b.blob_name.includes('.quota_'));
    if (quotaBlobs.length === 0) return null;

    const values = quotaBlobs.map(b => {
      const parts = b.blob_name.split('.quota_');
      const val = parseInt(parts[parts.length - 1]);
      return isNaN(val) ? 0 : val;
    });

    return Math.max(...values) || null;
  } catch (err) {
    return null;
  }
}

/**
 * Helper to convert Shelby microsecond timestamps to JS Date objects
 */
export function fromShelbyTimestamp(micros: string | number): Date {
  return new Date(Number(micros) / 1000);
}

/**
 * Helper to format bytes to human readable string
 */
export function formatBytes(bytes: number | string) {
  const b = Number(bytes);
  if (b === 0) return "0 B";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
