// Fix 2: revocar los 4 feedbacks rotos (value=5, URIs placeholder) y dar
// feedbacks nuevos con value en escala 0-100 y archivos de razones reales en Pinata.
// Wallets tester: las mismas que dieron los feedbacks viejos (no puede ser el owner).
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
  { type: 'function', name: 'getLastIndex', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'clientAddress', type: 'address' }], outputs: [{ type: 'uint64' }] },
  { type: 'function', name: 'readFeedback', stateMutability: 'view', inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'clientAddress', type: 'address' }, { name: 'feedbackIndex', type: 'uint64' }], outputs: [{ name: 'value', type: 'int128' }, { name: 'valueDecimals', type: 'uint8' }, { name: 'tag1', type: 'string' }, { name: 'tag2', type: 'string' }, { name: 'isRevoked', type: 'bool' }] },
  { type: 'function', name: 'revokeFeedback', stateMutability: 'nonpayable', inputs: [{ name: 'agentId', type: 'uint256' }, { name: 'feedbackIndex', type: 'uint64' }], outputs: [] },
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

async function sendTx(walletClient, account, args, label) {
  const { request } = await publicClient.simulateContract({
    address: REPUTATION, abi: REP_ABI, functionName: args.fn, args: args.args, account,
  });
  const gas = await publicClient.estimateContractGas({
    address: REPUTATION, abi: REP_ABI, functionName: args.fn, args: args.args, account,
  });
  const hash = await walletClient.writeContract({ ...request, gas: gas * 13n / 10n });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(`  ${label}: ${receipt.status} | ${hash}`);
  return receipt.status === 'success';
}

const TESTERS = [
  { file: '.feedback-wallet.json',   value: 98, tag1: 'studio',      tag2: 'videodanza' },
  { file: '.feedback-wallet-2.json', value: 97, tag1: 'composition', tag2: 'deterministic' },
  { file: '.feedback-wallet-3.json', value: 100, tag1: 'x402',       tag2: 'payments' },
];

async function main() {
  if (!process.env.PINATA_JWT) { console.error('Falta PINATA_JWT'); process.exit(1); }

  // Fase 1: dar feedbacks nuevos primero (nunca quedamos sin reviews)
  console.log('=== Fase 1: feedbacks nuevos ===');
  let nuevosOk = 0;
  for (const t of TESTERS) {
    const acc = loadWallet(t.file);
    const walletClient = createWalletClient({ account: acc, chain: sepolia, transport: http(RPC_URL) });
    const createdAt = new Date().toISOString();

    // Archivo de razones ERC-8004 con MUST fields + contenido
    const fileForStorage = {
      agentRegistry: `eip155:11155111:${IDENTITY}`,
      agentId: Number(AGENT_ID),
      clientAddress: `eip155:11155111:${acc.address}`,
      createdAt,
      value: t.value,
      valueDecimals: 0,
      tag1: t.tag1,
      tag2: t.tag2,
      endpoint: ENDPOINT,
      text: `Feedback operativo para entropiav2 (token 2387). Verificacion: endpoints MCP/A2A responden 200, x402 liquida USDC en Base Sepolia, salud on-chain correcta. Puntuacion ${t.value}/100.`,
      context: { source: 'studio-ops', network: 'sepolia', tokenId: 2387 },
    };

    console.log(`${t.file} -> value=${t.value} tags=${t.tag1}/${t.tag2}`);
    let cid;
    try {
      cid = await pinToPinata(fileForStorage);
      console.log(`  Pinata CID: ${cid}`);
    } catch (e) {
      console.error('  Pinata fallo:', (e.message || String(e)).slice(0, 200));
      continue;
    }

    const feedbackURI = `ipfs://${cid}`;
    const sortedJson = JSON.stringify(fileForStorage, Object.keys(fileForStorage).sort());
    const feedbackHash = keccak256(toHex(sortedJson));

    try {
      const ok = await sendTx(walletClient, acc, {
        fn: 'giveFeedback',
        args: [AGENT_ID, BigInt(t.value), 0, t.tag1, t.tag2, ENDPOINT, feedbackURI, feedbackHash],
      }, 'giveFeedback');
      if (ok) nuevosOk++;
    } catch (e) {
      console.error('  giveFeedback fallo:', (e.shortMessage || e.message || String(e)).slice(0, 300));
    }
  }

  // Fase 2: revocar feedbacks viejos rotos (value=5, URIs placeholder)
  console.log('\n=== Fase 2: revocar feedbacks viejos ===');
  if (nuevosOk === 0) {
    console.error('Ningun feedback nuevo tuvo exito; NO se revoca nada. Abortando.');
    process.exit(1);
  }
  for (const t of TESTERS) {
    const acc = loadWallet(t.file);
    const walletClient = createWalletClient({ account: acc, chain: sepolia, transport: http(RPC_URL) });
    const last = await publicClient.readContract({ address: REPUTATION, abi: REP_ABI, functionName: 'getLastIndex', args: [AGENT_ID, acc.address] });
    console.log(`${t.file} (${acc.address}) lastIndex=${last}`);
    for (let i = 1n; i <= last; i++) {
      const fb = await publicClient.readContract({ address: REPUTATION, abi: REP_ABI, functionName: 'readFeedback', args: [AGENT_ID, acc.address, i] });
      const [value, , tag1, tag2, isRevoked] = fb;
      if (isRevoked) { console.log(`  idx ${i}: ya revocado`); continue; }
      // Solo revocar los viejos rotos (value=5). Los nuevos tienen value 97-100.
      if (Number(value) > 10) { console.log(`  idx ${i}: value=${value} (nuevo), se queda`); continue; }
      console.log(`  idx ${i}: value=${value} tags=${tag1}/${tag2} -> revocando`);
      try {
        await sendTx(walletClient, acc, { fn: 'revokeFeedback', args: [AGENT_ID, i] }, `revoke idx ${i}`);
      } catch (e) {
        console.error(`  revoke idx ${i} fallo:`, (e.shortMessage || e.message || String(e)).slice(0, 200));
      }
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
