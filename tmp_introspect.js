

const query = `
query {
  __schema {
    queryType {
      fields {
        name
      }
    }
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
