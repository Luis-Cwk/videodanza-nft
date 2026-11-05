// Fix 1: setAgentWallet on-chain para entropiav2 #2387 (Sepolia).
// El agenteWallet estaba en 0x0 (la transferencia del NFT lo reseteo).
// Lo setea a la wallet owner 0xD70E...40cF (misma que firma; caso one-wallet del SDK).
// Requiere: PRIVATE_KEY (owner) y PINATA_JWT en .env
import 'dotenv/config';
import { SDK } from 'agent0-sdk';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';

const AGENT_ID = process.env.AGENT_ID || '11155111:2387';
const NEW_WALLET = '0xD70ECAff906A739167EFD20275D0a1d518AC40cF';
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

if (!process.env.PRIVATE_KEY) {
  console.error('Falta PRIVATE_KEY en .env');
  process.exit(1);
}

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

console.log('=== Fix 1: setAgentWallet ===');
console.log('Agente:', AGENT_ID);
console.log('Nueva wallet:', NEW_WALLET);

const sdk = new SDK({
  chainId: 11155111,
  rpcUrl: RPC_URL,
  signer: process.env.PRIVATE_KEY,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
});

console.log('Cargando agente...');
const agent = await sdk.loadAgent(AGENT_ID);

const before = await agent.getWallet();
console.log('agentWallet actual:', before);

if (before && before.toLowerCase() === NEW_WALLET.toLowerCase()) {
  console.log('Ya esta seteada. Nada que hacer.');
  process.exit(0);
}

// Deadline con margen: chainNow + 240s (el SDK valida <= chainNow + 300 y > chainNow)
const block = await publicClient.getBlock({ blockTag: 'latest' });
const chainNow = Number(block.timestamp);
const deadline = chainNow + 240;
console.log('Chain time:', chainNow, '| deadline:', deadline);

console.log('Enviando setWallet (firma EIP-712 one-wallet + tx del owner)...');
const tx = await agent.setWallet(NEW_WALLET, { deadline });
if (!tx) {
  console.log('setWallet devolvio undefined (ya seteada?).');
  process.exit(0);
}
console.log('Tx hash:', tx.hash);
await tx.waitMined({ confirmations: 1 });
console.log('Confirmada.');

const after = await agent.getWallet();
console.log('agentWallet nuevo:', after);
if (after && after.toLowerCase() === NEW_WALLET.toLowerCase()) {
  console.log('OK: agentWallet actualizado correctamente.');
} else {
  console.error('ALERTA: la wallet no quedo como se esperaba.');
  process.exit(1);
}
