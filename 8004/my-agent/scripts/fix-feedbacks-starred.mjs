// Fix 2b: dar feedbacks con tag1="starred" (el tag que 8004scan usa para
// poblar el campo "score" que alimenta el average_score).
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, keccak256, toHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
const AGENT_ID = 2387n;
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const ENDPOINT = 'https://my-agent-tau.vercel.app/.well-known/agent-card.json';

const REP_ABI = [
  { type: 'function', name: 'giveFeedback', stateMutability: 'nonpayable', inputs: [
    { name: 'agentId', type: 'uint256' },
    { name: 'value', type: 'int128' },
    { name: 'valueDecimals', type: 'uint8' },
    { name: 'tag1', type: 'string' },
    { name: 'tag2', type: 'string' },
    { name: 'endpoint', type: 'string' },
    { name: 'feedbackURI', type: 'string' },
    { name: 'feedbackHash', type: 'bytes32' },
  ], outputs: [] },
];

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC_URL) });

function loadWallet(file) {
  const j = JSON.parse(readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'));
  const pk = j.privateKey || j.private_key || j.key || j.pk;
  if (!pk) throw new Error(`Sin privateKey en ${file}`);
  return privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
}

async function pinToPinata(fileJson) {
  const formData = new FormData();
  formData.append('file', new Blob([JSON.stringify(fileJson)], { type: 'application/json' }), 'feedback.json');
  formData.append('network', 'public');
  const res = await fetch('https://uploads.pinata.cloud/v3/files', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.PINATA_JWT}` },
    body: formData,
  });
  if (!res.ok) throw new Error(`Pinata HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = await res.json();
  const cid = data?.data?.cid || data?.cid || data?.IpfsHash;
  if (!cid) throw new Error(`Sin CID: ${JSON.stringify(data).slice(0, 200)}`);
  return cid;
}

// Los 3 wallets con value 98/97/100, ahora tag "starred"
const TESTERS = [
  { file: '.feedback-wallet.json',   value: 98 },
  { file: '.feedback-wallet-2.json', value: 97 },
  { file: '.feedback-wallet-3.json', value: 100 },
];

for (const t of TESTERS) {
  const acc = loadWallet(t.file);
  const walletClient = createWalletClient({ account: acc, chain: sepolia, transport: http(RPC_URL) });
  const createdAt = new Date().toISOString();

  const fileForStorage = {
    agentRegistry: `eip155:11155111:${IDENTITY}`,
    agentId: Number(AGENT_ID),
    clientAddress: `eip155:11155111:${acc.address}`,
    createdAt,
    value: String(t.value),
    valueDecimals: 0,
    tag1: 'starred',
    tag2: 'videodanza',
    endpoint: ENDPOINT,
    reasoning: `Calificacion ${t.value}/100 para entropiav2. Endpoints MCP/A2A verificados (200), x402 operativo con recibos onchain, metadata completa. Servicio estable para composiciones de videodanza generativa.`,
  };

  console.log(`${t.file} -> starred value=${t.value}`);
  try {
    const cid = await pinToPinata(fileForStorage);
    console.log(`  CID: ${cid}`);
    const feedbackURI = `ipfs://${cid}`;
    const sortedJson = JSON.stringify(fileForStorage, Object.keys(fileForStorage).sort());
    const feedbackHash = keccak256(toHex(sortedJson));

    const { request } = await publicClient.simulateContract({
      address: REPUTATION, abi: REP_ABI, functionName: 'giveFeedback',
      args: [AGENT_ID, BigInt(t.value), 0, 'starred', 'videodanza', ENDPOINT, feedbackURI, feedbackHash],
      account: acc,
    });
    const gas = await publicClient.estimateContractGas({
      address: REPUTATION, abi: REP_ABI, functionName: 'giveFeedback',
      args: [AGENT_ID, BigInt(t.value), 0, 'starred', 'videodanza', ENDPOINT, feedbackURI, feedbackHash],
      account: acc,
    });
    const hash = await walletClient.writeContract({ ...request, gas: gas * 13n / 10n });
    const receipt = await publicClient.waitForTransactionReceipt({ hash });
    console.log(`  tx: ${receipt.status} | ${hash}`);
  } catch (e) {
    console.error(`  fallo:`, (e.shortMessage || e.message || String(e)).slice(0, 250));
  }
}

console.log('\nListo. Esperar rescore de 8004scan.');
