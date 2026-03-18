/**
 * Shelby Indexer Utility
 * Fetches blob metadata and account statistics directly from the Shelby GraphQL Indexer.
 */

const SHELBY_INDEXER_URL = "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql";

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
      blobs(where: { owner: { _eq: $owner }, is_deleted: { _eq: 0 } }, order_by: { created_at: desc }) {
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
    const response = await fetch(SHELBY_INDEXER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey || "AG-7FPFEZSPINUP4F7HKVSIO1ZPOEDZ8E5WN"}`
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
 * Normalizes an Aptos address to a full 64-character hex string (excluding 0x).
 * This is often required by Shelby Gateway for strict path matching.
 */
function normalizeAptosAddress(addr: string): string {
  let clean = addr.toLowerCase();
  if (clean.startsWith("0x")) {
    clean = clean.slice(2);
  }
  // Pad to 64 characters with leading zeros
  return "0x" + clean.padStart(64, "0");
}

/**
 * Fetches raw blob data from the Shelby network for decryption.
 */
export async function fetchBlobData(blobName: string, owner: string): Promise<Blob> {
  const apiKey = localStorage.getItem("VITE_SHELBY_API_KEY") || "AG-7FPFEZSPINUP4F7HKVSIO1ZPOEDZ8E5WN";
  // Official Shelby Gateway URL with normalized owner address
  const normalizedOwner = normalizeAptosAddress(owner);
  const url = `https://api.testnet.shelby.xyz/shelby/v1/blobs/${normalizedOwner}/${encodeURIComponent(blobName)}`;

  const maxAttempts = 3;
  const delayMs = 2000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const response = await fetch(url, {
      headers: {
        "Authorization": `Bearer ${apiKey}`
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
