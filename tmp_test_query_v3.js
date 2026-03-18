
const query = `
query GetAllBlobs {
  blobs(limit: 5, where: { is_deleted: { _eq: 0 } }) {
    blob_name
    size
    created_at
    expires_at
    owner
  }
}
`;

async function main() {
  const response = await fetch('https://api.testnet.aptoslabs.com/nocode/v1/public/alias/shelby/testnet/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer AG-7FPFEZSPINUP4F7HKVSIO1ZPOEDZ8E5WN'
    },
    body: JSON.stringify({ query })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
