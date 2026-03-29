const fetch = require("node-fetch-commonjs");
async function run() {
  const q = `query { blobs(where: { owner: { _eq: "0xa834d8efce291fc5cedc8fec93531b2ebbcaf0858102b4260bd25c7ccb123cf4" } }) { blob_name, transaction_hash } }`;
  const res = await fetch("https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: q })
  });
  const data = await res.json();
  const blobs = data.data.blobs;
  console.log("Total Blobs:", blobs.length);
  const uniqueNames = new Set(blobs.map(b => b.blob_name));
  console.log("Unique Names:", uniqueNames.size);
  const uniqueTxs = new Set(blobs.map(b => b.transaction_hash));
  console.log("Unique Txs:", uniqueTxs.size);
}
run();
