const hre = require("hardhat");

async function main() {
  console.log("🚀 Iniciando deployment de VideoDanzaNFT a Ethereum Sepolia...\n");

  // Obtener el network actual
  const network = await hre.ethers.provider.getNetwork();
  console.log(`📡 Red: ${network.name} (Chain ID: ${network.chainId})`);

  // Obtener el deployer
  const [deployer] = await hre.ethers.getSigners();
  console.log(`👤 Deployer: ${deployer.address}`);

  // Obtener balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log(`💰 Balance: ${hre.ethers.formatEther(balance)} ETH\n`);

  // Validar que tenemos suficiente ETH
  if (balance === 0n) {
    throw new Error(
      "❌ Sin ETH en la wallet. Obtén ETH de testnet faucet: https://sepolia.etherscan.io/faucet"
    );
  }

  // Compilar contrato
  console.log("📦 Compilando contrato...");
  await hre.run("compile");
  console.log("✅ Compilación exitosa\n");

  // Deploy
  console.log("⛽ Desplegando contrato VideoDanzaNFT...");
  const VideoDanzaNFT = await hre.ethers.getContractFactory("VideoDanzaNFT");
  const videoDanzaNFT = await VideoDanzaNFT.deploy(deployer.address);

  // Esperar a que se confirme
  const deployTx = videoDanzaNFT.deploymentTransaction();
  console.log(`📝 TX Hash: ${deployTx.hash}`);

  await videoDanzaNFT.waitForDeployment();
  const contractAddress = await videoDanzaNFT.getAddress();

  console.log("\n✅ ¡Deployment exitoso!");
  console.log(`📍 Dirección del contrato: ${contractAddress}\n`);

  // Verificar contrato
  console.log("🔍 Verificando contrato en la blockchain...");
  const deployedCode = await hre.ethers.provider.getCode(contractAddress);
  if (deployedCode === "0x") {
    throw new Error("❌ Contrato no fue deployado correctamente");
  }
  console.log("✅ Contrato verificado en blockchain\n");

  // Validar datos del contrato
  console.log("📋 Validando parámetros del contrato:");
  const owner = await videoDanzaNFT.owner();
  const mintPrice = await videoDanzaNFT.mintPrice();
  const totalSupply = await videoDanzaNFT.totalSupply();
  const name = await videoDanzaNFT.name();
  const symbol = await videoDanzaNFT.symbol();

  console.log(`  - Propietario: ${owner}`);
  console.log(`  - Nombre: ${name}`);
  console.log(`  - Símbolo: ${symbol}`);
  console.log(`  - Precio de mint: ${hre.ethers.formatEther(mintPrice)} ETH`);
  console.log(`  - Supply total: ${totalSupply}\n`);

  // Validar propietario
  if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
    throw new Error(
      "❌ El propietario del contrato no coincide con el deployer"
    );
  }
  console.log("✅ Propietario correcto confirmado\n");

  // Información de explorador
  console.log("🔗 Enlaces útiles:");
  console.log(
    `  - Explorador: https://sepolia.etherscan.io/address/${contractAddress}`
  );
  console.log(
    `  - RPC: https://ethereum-sepolia.publicnode.com/`
  );

  // Guardar dirección en archivo
  const fs = require("fs");
  const path = require("path");
  const networkName = "sepolia";
  const deploymentFile = path.join(
    __dirname,
    `../deployments/${networkName}.json`
  );
  const deploymentsDir = path.dirname(deploymentFile);

  // Crear directorio si no existe
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deployment = {
    network: networkName,
    chainId: network.chainId,
    contractAddress: contractAddress,
    owner: owner,
    mintPrice: mintPrice.toString(),
    deployerAddress: deployer.address,
    deploymentHash: deployTx.hash,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log(
    `\n💾 Información de deployment guardada en: ${deploymentFile}`
  );

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETADO EXITOSAMENTE");
  console.log("=".repeat(60));
  console.log(`\n📌 PRÓXIMOS PASOS:`);
  console.log(`1. Copiar la dirección del contrato: ${contractAddress}`);
  console.log(`2. Actualizar .env.local con: NEXT_PUBLIC_CONTRACT_ADDRESS`);
  console.log(`3. Proceder a FASE 1.5: Configurar Pinata IPFS`);
  console.log("\n");

  return contractAddress;
}

main()
  .then((address) => process.exit(0))
  .catch((error) => {
    console.error("❌ Error en deployment:", error);
    process.exit(1);
  });
