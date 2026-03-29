const apiKey = "AG-7FPFEZSPINUP4F7HKVSIO1ZPOEDZ8E5WN";

async function run() {
  const query = `query GetUserBlobs { 
    blobs(where: { owner: { _eq: "0xa834d8efce291fc5cedc8fec93531b2ebbcaf0858102b4260bd25c7ccb123cf4" } }, order_by: { created_at: desc }) { 
      blob_name 
    } 
  }`;
  
  try {
    const res = await fetch("https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({ query })
    });
    
    const data = await res.json();
    
    if (data.errors) {
      console.error("GraphQL Errors:", data.errors);
      return;
    }
    
    const blobs = data.data.blobs;
    console.log("Total Raw Blobs:", blobs.length);
    
    const uniqueNames = new Set(blobs.map(b => b.blob_name));
    console.log("Unique Blobs by Name:", uniqueNames.size);
    
    // Check for duplicates
    const counts = {};
    for (const b of blobs) {
      counts[b.blob_name] = (counts[b.blob_name] || 0) + 1;
    }
    
    console.log("Duplicates:");
    for (const [name, count] of Object.entries(counts)) {
      if (count > 1) {
        console.log(`- ${name}: ${count} times`);
      }
    }
  } catch(e) {
    console.error("Fetch failed:", e);
  }
}

run();
