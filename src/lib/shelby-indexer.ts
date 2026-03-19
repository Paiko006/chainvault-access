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
}

/**
 * Fetches all active (not deleted) blobs owned by a specific address.
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
      }
    }
  `;

  try {
    const normalizedOwner = normalizeAptosAddress(owner);
    const effectiveApiKey = apiKey || localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || PUBLIC_SHELBY_API_KEY;
    
    console.info("[Shelby] Fetching blobs for:", normalizedOwner);
    console.info("[Shelby] Using API Key (start):", effectiveApiKey?.slice(0, 5));
    
    const response = await fetch(SHELBY_INDEXER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(effectiveApiKey ? { 
          "Authorization": `Bearer ${effectiveApiKey}`,
          "x-api-key": effectiveApiKey 
        } : {})
      },
      body: JSON.stringify({
        query,
        variables: { owner: normalizedOwner }
      })
    });

    if (!response.ok) {
      throw new Error(`Indexer request failed: ${response.statusText}`);
    }

    const { data, errors } = await response.json();
    
    if (errors) {
      console.error("[ShelbyIndexer] GraphQL Errors:", errors);
      return [];
    }

    return data?.blobs || [];
  } catch (error) {
    console.error("[ShelbyIndexer] Fetch error:", error);
    return [];
  }
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
      }
    }
  `;

  try {
    const normalizedSharee = normalizeAptosAddress(sharee);
    const effectiveApiKey = apiKey || localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || PUBLIC_SHELBY_API_KEY;
    
    const response = await fetch(SHELBY_INDEXER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(effectiveApiKey ? { 
          "Authorization": `Bearer ${effectiveApiKey}`,
          "x-api-key": effectiveApiKey 
        } : {})
      },
      body: JSON.stringify({
        query,
        variables: { sharee: normalizedSharee }
      })
    });

    if (!response.ok) {
      throw new Error(`Indexer request failed: ${response.statusText}`);
    }

    const { data, errors } = await response.json();
    
    if (errors) {
      console.error("[ShelbyIndexer] GraphQL Errors:", errors);
      return [];
    }

    return data?.blobs || [];
  } catch (error) {
    console.error("[ShelbyIndexer] Fetch shared error:", error);
    return [];
  }
}

/**
 * Normalizes an Aptos address to a full 64-character hex string (excluding 0x).
 * This is often required by Shelby Gateway for strict path matching.
 */
function normalizeAptosAddress(addr: string): string {
  let clean = addr.toLowerCase();
  if (!clean.startsWith("0x")) {
    clean = "0x" + clean;
  }
  // For Shelby/Geomi Indexer, we should use the standard 64-char hex string (padded)
  const parts = clean.split("0x");
  const hex = parts[1] || parts[0];
  return "0x" + hex.padStart(64, "0");
}

/**
 * Fetches raw blob data from the Shelby network for decryption.
 */
export async function fetchBlobData(blobName: string, owner: string): Promise<Blob> {
  const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || import.meta.env.VITE_SHELBY_API_KEY || PUBLIC_SHELBY_API_KEY;
  
  // The indexer returns blob_name as "@address/suffix". 
  // We need to extract only the suffix for the Gateway URL.
  let cleanBlobName = blobName;
  if (cleanBlobName.includes('/')) {
    cleanBlobName = cleanBlobName.split('/').slice(1).join('/');
  } else if (cleanBlobName.startsWith('@')) {
    // Fallback if formatting is weird but still has @
    const firstSlash = cleanBlobName.indexOf('/');
    if (firstSlash !== -1) {
       cleanBlobName = cleanBlobName.substring(firstSlash + 1);
    }
  }

  const normalizedOwner = normalizeAptosAddress(owner);
  // Gateway expects: .../blobs/{owner}/{blobNameSuffix}
  // Important: Do NOT encode the whole suffix if it contains slashes (directory structure)
  // Our files don't have slashes, but for generic safety we encode parts.
  const encodedName = cleanBlobName.split('/').map(p => encodeURIComponent(p)).join('/');
  const url = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${normalizedOwner}/${encodedName}`;

  const maxAttempts = 3;
  const delayMs = 2000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "x-api-key": apiKey
      }
    });
    if (response.ok) {
      return await response.blob();
    }
    if (response.status === 404 && attempt < maxAttempts) {
      // Might still be syncing, wait and retry
      await new Promise(r => setTimeout(r, delayMs));
      continue;
    }
    if (response.status === 404) {
      throw new Error("File not found on Shelby network. It might still be syncing.");
    }
    if (response.status === 401) {
      throw new Error("Unauthorized. Please check your API Key in Settings.");
    }
    throw new Error(`Network error (${response.status}): ${response.statusText}`);
  }
  // Should never reach here
  throw new Error("Failed to fetch blob after multiple attempts.");
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
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(2)} MB`;
}
