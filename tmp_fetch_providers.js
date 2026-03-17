async function main() {
  const address = '0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a';
  const resourceType = '0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a::storage_provider_registry::StorageProviders';
  const url = `https://api.testnet.aptoslabs.com/v1/accounts/${address}/resource/${resourceType}`;
  
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
