/**
 * Utility to fetch and map Shelby Storage Providers
 */

export interface StorageProvider {
  name: string;
  address: string;
  location: string;
  lat: number;
  lng: number;
  status: 'active' | 'inactive';
}

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number; location: string }> = {
  "Duoro-0": { lat: 51.1657, lng: 10.4515, location: "Germany" },
  "Nova-0": { lat: 51.1657, lng: 10.4515, location: "Germany" },
  "AR-0": { lat: 51.1657, lng: 10.4515, location: "Germany" },
  "AR-3": { lat: 52.5200, lng: 13.4050, location: "Germany" },
  "Jump-AMS-0": { lat: 52.3676, lng: 4.9041, location: "Netherlands" },
  "Jump-AMS-1": { lat: 52.3676, lng: 4.9041, location: "Netherlands" },
  "AR-1": { lat: 52.3676, lng: 4.9041, location: "Netherlands" },
  "Jump-LON-0": { lat: 51.5074, lng: -0.1278, location: "United Kingdom" },
  "Jump-LON-1": { lat: 51.5074, lng: -0.1278, location: "United Kingdom" },
  "AR-2": { lat: 51.5074, lng: -0.1278, location: "United Kingdom" },
  "Stakely-0": { lat: 48.8566, lng: 2.3522, location: "France" },
  "Republic-0": { lat: 37.0902, lng: -95.7129, location: "United States" },
  "Nova-1": { lat: 37.0902, lng: -95.7129, location: "United States" },
  "SG-0": { lat: 1.3521, lng: 103.8198, location: "Singapore" },
  "TYO-0": { lat: 35.6762, lng: 139.6503, location: "Japan" },
};

const SHELBY_CONTRACT = "0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a";
const REGISTRY_RESOURCE = `${SHELBY_CONTRACT}::storage_provider_registry::StorageProviders`;

// Recursive function to deeply collect all 'entries' from any BPlusTree structure
function collectAllEntries(obj: any, allEntries: any[] = []): any[] {
  if (!obj || typeof obj !== 'object') return allEntries;
  
  // If we found an entries array, add its contents
  if (Array.isArray(obj.entries)) {
    allEntries.push(...obj.entries);
  }
  
  // Also check for the common BPlusTree variant pattern where entries are inside a value
  if (obj.value && Array.isArray(obj.value.entries)) {
    allEntries.push(...obj.value.entries);
  }

  // Recurse into all object properties to find more entries
  for (const key in obj) {
    if (obj[key] && typeof obj[key] === 'object' && key !== 'entries') {
      collectAllEntries(obj[key], allEntries);
    }
  }
  
  return allEntries;
}

export async function fetchStorageProviders(): Promise<StorageProvider[]> {
  try {
    const url = `https://api.testnet.aptoslabs.com/v1/accounts/${SHELBY_CONTRACT}/resource/${REGISTRY_RESOURCE}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch providers: ${response.statusText}`);
    }
    
    const resourceResult = await response.json();
    const providers: StorageProvider[] = [];
    const seenAddrs = new Set<string>();

    const shellData = resourceResult?.data || resourceResult;
    const activeProvidersList = collectAllEntries(shellData);
    
    activeProvidersList.forEach((entry: any) => {
      if (!entry || typeof entry !== 'object' || !entry.key) return;
      
      const name = entry.key;
      const value = entry.value?.value || entry.value;
      const details = Array.isArray(value) ? value[0] : value;
      
      // Determine the address: use explicit field if available, fallback to entry key if it looks like an address
      let addr = "Unknown";
      if (details && typeof details === 'object') {
        const addrSpec = details.addr || details.account_id || details.address;
        addr = typeof addrSpec === 'string' ? addrSpec : (addrSpec?.address || "Unknown");
      }
      
      if (addr === "Unknown" && typeof name === 'string' && name.startsWith("0x")) {
        addr = name;
      }
      
      if (addr !== "Unknown" && !seenAddrs.has(addr)) {
        seenAddrs.add(addr);
        
        let coords = KNOWN_LOCATIONS[name];
        
        // Heuristic fallback for unknown names
        if (!coords) {
          const upperName = name.toUpperCase();
          if (upperName.includes("LON")) coords = KNOWN_LOCATIONS["Jump-LON-0"];
          else if (upperName.includes("AMS")) coords = KNOWN_LOCATIONS["Jump-AMS-0"];
          else if (upperName.includes("SG")) coords = KNOWN_LOCATIONS["SG-0"];
          else if (upperName.includes("TYO") || upperName.includes("JAPAN")) coords = KNOWN_LOCATIONS["TYO-0"];
          else if (upperName.includes("USA") || upperName.includes("US") || upperName.includes("NY") || upperName.includes("REPUBLIC")) coords = KNOWN_LOCATIONS["Republic-0"];
          else {
             // Default jitter logic
             const fallback = KNOWN_LOCATIONS["Duoro-0"];
             coords = { 
               lat: fallback.lat + (Math.random() - 0.5) * 20, 
               lng: fallback.lng + (Math.random() - 0.5) * 20, 
               location: "Other" 
             };
          }
        }
        
        providers.push({
          name,
          address: addr,
          location: coords.location,
          lat: coords.lat,
          lng: coords.lng,
          status: 'active'
        });
      }
    });
    
    return providers;
  } catch (error) {
    return [];
  }
}
