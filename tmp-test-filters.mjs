
const URL = "https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql";
const API_KEY = "AG-7FPFEZSPINUP4F7HKVSIO1ZPOEDZ8E5WN";

async function testFilters() {
  const qStr = `query { blobs(limit: 1, where: { is_deleted: { _eq: "0" } }) { blob_name } }`;
  const qNum = `query { blobs(limit: 1, where: { is_deleted: { _eq: 0 } }) { blob_name } }`;
  
  const h = { 
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "x-api-key": API_KEY
  };

  try {
    const r1 = await fetch(URL, { method: "POST", headers: h, body: JSON.stringify({ query: qStr }) }).then(res => res.json());
    console.log("STRING FILTER:", r1.errors ? r1.errors[0].message : "SUCCESS!");

    const r2 = await fetch(URL, { method: "POST", headers: h, body: JSON.stringify({ query: qNum }) }).then(res => res.json());
    console.log("NUMBER FILTER:", r2.errors ? r2.errors[0].message : "SUCCESS!");
  } catch (e) {
    console.log("FAILED:", e.message);
  }
}

testFilters();
