async function main() {
  const address = '0x44a061a97bb40d43ef0b1542dca0a2c949735351d5ada8542dc74242c1d09e92';
  const resourceType = '0x85fdb9a176ab8ef1d9d9c1b60d60b3924f0800ac1de1cc2085fb0b8bb4988e6a::storage_provider::StorageProvider';
  const url = `https://api.testnet.aptoslabs.com/v1/accounts/${address}/resource/${resourceType}`;
  
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

main();
