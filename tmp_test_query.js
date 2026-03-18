
const ownerAddress = "0x44a061a97bb40d43ef0b1542dca0a2c949735351d5ada8542dc74242c1d09e92"; // Sample Duoro-0 or similar
const query = `
query GetUserBlobs($owner: String!) {
  blobs(where: { owner: { _eq: $owner }, is_deleted: { _eq: false } }) {
    blob_name
    size
    created_at
    expires_at
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
    body: JSON.stringify({ 
      query,
      variables: { owner: ownerAddress }
    })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
