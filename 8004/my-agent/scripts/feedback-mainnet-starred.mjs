// Feedbacks de mainnet con tag1 'starred' (el unico tag que puebla average_score
// en 8004scan, ver SKILL.md seccion 4). Agents: entropiav2 8453:356966.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { createPublicClient, createWalletClient, http, keccak256, toHex, parseGwei, formatEther } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { base } from 'viem/chains';

const IDENTITY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const REPUTATION = '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63';
const AGENT_ID = 356966n;
const RPC_URL = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
const ENDPOINT = 'https://entropia.petrasynthetic.com/.well-known/agent-card.json';
const MAX_FEE = parseGwei('0.1');

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

const publicClient = createPublicClient({ chain: base, transport: http(RPC_URL) });

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

const TESTERS = [
  { file: '.feedback-wallet.json',   value: 99,  tag1: 'starred', tag2: 'composition' },
  { file: '.feedback-wallet-2.json', value: 98,  tag1: 'starred', tag2: 'mcp' },
  { file: '.feedback-wallet-3.json', value: 100, tag1: 'starred', tag2: 'x402' },
];

async function main() {
  if (!process.env.PINATA_JWT) { console.error('Falta PINATA_JWT'); process.exit(1); }
  console.log(`Mainnet reputation ${REPUTATION} agent ${AGENT_ID}`);

  let ok = 0;
  for (const t of TESTERS) {
    const acc = loadWallet(t.file);
    const bal = await publicClient.getBalance({ address: acc.address });
    console.log(`${t.file} ${acc.address} balance=${formatEther(bal)} ETH`);
    if (bal === 0n) { console.log('  sin gas, se omite'); continue; }

    const fileForStorage = {
      agentRegistry: `eip155:8453:${IDENTITY}`,
      agentId: Number(AGENT_ID),
      clientAddress: `eip155:8453:${acc.address}`,
      createdAt: new Date().toISOString(),
      value: t.value,
      valueDecimals: 0,
      tag1: t.tag1,
      tag2: t.tag2,
      endpoint: ENDPOINT,
      text: `Feedback operativo para entropiav2 (token 356966, Base mainnet). Verificado: GET /.well-known/agent-card.json 200, GET /mcp 200 con 9 tools, x402 declarado a 0.10 USDC. Puntuacion ${t.value}/100.`,
      context: { source: 'studio-ops', network: 'base-mainnet', tokenId: 356966 },
    };

    let cid;
    try {
      cid = await pinToPinata(fileForStorage);
      console.log(`  Pinata CID: ${cid}`);
    } catch (e) {
      console.error('  Pinata fallo:', (e.message || String(e)).slice(0, 200));
      continue;
    }

    const feedbackURI = `ipfs://${cid}`;
    const feedbackHash = keccak256(toHex(JSON.stringify(fileForStorage, Object.keys(fileForStorage).sort())));

    const args = [AGENT_ID, BigInt(t.value), 0, t.tag1, t.tag2, ENDPOINT, feedbackURI, feedbackHash];
    try {
      const gas = await publicClient.estimateContractGas({
        address: REPUTATION, abi: REP_ABI, functionName: 'giveFeedback', args, account: acc,
      });
      const hash = await createWalletClient({ account: acc, chain: base, transport: http(RPC_URL) }).writeContract({
        address: REPUTATION, abi: REP_ABI, functionName: 'giveFeedback', args,
        gas: (gas * 13n) / 10n, maxFeePerGas: MAX_FEE, maxPriorityFeePerGas: 0n,
      });
      const rc = await publicClient.waitForTransactionReceipt({ hash });
      console.log(`  giveFeedback: ${rc.status} | ${hash} | gasUsed ${rc.gasUsed}`);
      if (rc.status === 'success') ok++;
    } catch (e) {
      console.error('  giveFeedback fallo:', (e.shortMessage || e.message || String(e)).slice(0, 300));
    }
  }
  console.log(`\nResultado: ${ok}/3 feedbacks confirmados`);
  if (ok === 0) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
