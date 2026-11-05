// Prueba de lectura: loadAgent + getWallet sin escribir nada.
import 'dotenv/config';
import { SDK } from 'agent0-sdk';

const AGENT_ID = '11155111:2387';
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

const sdk = new SDK({
  chainId: 11155111,
  rpcUrl: RPC_URL,
  signer: process.env.PRIVATE_KEY,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT,
});

console.log('Cargando agente (solo lectura)...');
const agent = await sdk.loadAgent(AGENT_ID);
console.log('Agent loaded OK');
console.log('agentId:', agent.registrationFile?.agentId);
const wallet = await agent.getWallet();
console.log('getWallet():', wallet);
