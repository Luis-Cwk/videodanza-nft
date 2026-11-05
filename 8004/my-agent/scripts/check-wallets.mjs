// Diagnostico de wallets y estado on-chain (previo a fixes de 8004scan).
// NO imprime llaves privadas, solo direcciones y saldos.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, http, getAddress } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const DIR = new URL('../', import.meta.url);

function loadWallet(name) {
  const j = JSON.parse(readFileSync(new URL(name, DIR), 'utf8'));
  const pk = j.privateKey || j.private_key || j.key || j.pk;
  if (!pk) return { file: name, error: 'no privateKey field', fields: Object.keys(j) };
  const acc = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
  return { file: name, address: acc.address };
}

const envPk = process.env.PRIVATE_KEY;
const envAddr = envPk ? privateKeyToAccount(envPk.startsWith('0x') ? envPk : `0x${envPk}`).address : null;

const wallets = [
  { file: '.env PRIVATE_KEY', address: envAddr },
  loadWallet('.owner-wallet.json'),
  loadWallet('.feedback-wallet.json'),
  loadWallet('.feedback-wallet-2.json'),
  loadWallet('.feedback-wallet-3.json'),
];

const rpc = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const client = createPublicClient({ chain: sepolia, transport: http(rpc) });

const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const ABI = [
  { type: 'function', name: 'ownerOf', stateMutability: 'view', inputs: [{ name: 'tokenId', type: 'uint256' }], outputs: [{ type: 'address' }] },
  { type: 'function', name: 'getAgentWallet', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }], outputs: [{ type: 'address' }] },
];

const chainState = {};
try {
  chainState.ownerOf2387 = await client.readContract({ address: REGISTRY, abi: ABI, functionName: 'ownerOf', args: [2387n] });
} catch (e) { chainState.ownerOf2387_error = e.shortMessage || e.message; }
try {
  chainState.agentWallet2387 = await client.readContract({ address: REGISTRY, abi: ABI, functionName: 'getAgentWallet', args: [2387n] });
} catch (e) { chainState.agentWallet2387_error = e.shortMessage || e.message; }

const balances = {};
for (const w of wallets) {
  if (!w.address) { balances[w.file] = w; continue; }
  try {
    const [bal, txs] = await Promise.all([
      client.getBalance({ address: w.address }),
      client.getTransactionCount({ address: w.address }),
    ]);
    balances[w.file] = { address: w.address, eth: Number(bal) / 1e18, txns: txs };
  } catch (e) {
    balances[w.file] = { address: w.address, error: e.message };
  }
}

console.log(JSON.stringify({
  rpc,
  pinataJwtPresent: !!process.env.PINATA_JWT,
  chainState,
  balances,
}, null, 2));
