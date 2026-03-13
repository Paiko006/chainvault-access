import { Network } from "@aptos-labs/ts-sdk";
console.log("Networks:", Object.keys(Network));
console.log("Shelbynet value:", (Network as any).SHELBYNET);
