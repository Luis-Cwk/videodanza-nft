const hre = require("hardhat");

async function main() {
  const contract = await hre.ethers.getContractAt(
    "VideoDanzaNFT",
    "0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf"
  );
  
  const total = await contract.totalSupply();
  console.log("Total NFTs minteados:", total.toString());
  
  if (total > 0n) {
    console.log("\nTokens minteados:");
    for (let i = 0; i < Math.min(Number(total), 5); i++) {
      try {
        const seed = await contract.tokenIdToSeed(i);
        const owner = await contract.ownerOf(i);
        console.log(`Token ${i}: Seed ${seed.slice(0,18)}..., Owner ${owner.slice(0,6)}...${owner.slice(-4)}`);
      } catch(e) {
        console.log(`Token ${i}: Error - ${e.message}`);
      }
    }
  }
}

main().catch(console.error);
