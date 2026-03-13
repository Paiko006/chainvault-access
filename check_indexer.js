async function checkIndexer() {
  const url = "https://api.shelbynet.aptoslabs.com/nocode/v1/public/cmforrguw0042s601fn71f9l2/v1/graphql";
  const query = `
    query getBlobs {
      blobs(limit: 5, order_by: {created_at: desc}) {
        owner
        blob_name
        is_written
        created_at
      }
    }
  `;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query })
    });
    const result = await response.json();
    console.log("Latest Blobs:", JSON.stringify(result, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

checkIndexer();
