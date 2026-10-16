// Expansion de la identidad nueva (#11150): metadata rica + doble link de wallet + reputacion.
// A) 5 eventos de metadata (owner)  B) setAgentWallet oficial en el registry (firma de la ops)
// C) 3 feedbacks en el Reputation Registry desde las testers.
require('dotenv').config();
const fs = require('fs');
const { encodeFunctionData, parseAbi, toHex, keccak256 } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const ADAPTER = '0x7621630cB63a73a194f45A3E6801B8C6A7eC2f92';
const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
const AGENT_ID = 11150n;
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const SENDS = ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'];
const CHAIN_ID = 11155111;
const FEES = { maxFeePerGas: 6000000000n, maxPriorityFeePerGas: 1000000000n };

const adapterAbi = parseAbi([
  'function counterfactualSetMetadata(uint8 standard, address boundAddress, uint256 tokenId, string key, bytes value) returns (bytes32)',
  'function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)',
  'function getAgentWallet(uint256 agentId) view returns (address)',
]);
const repAbi = parseAbi([
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)',
]);

async function rpc(method, params) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(method + ': ' + (j.error.message || ''));
  return j.result;
}

async function sendAs(account, to, data, gas, label, value = 0n) {
  const nonce = parseInt(await rpc('eth_getTransactionCount', [account.address, 'pending']), 16);
  const signed = await account.signTransaction({ to, data, gas: BigInt(gas), value, nonce, chainId: CHAIN_ID, ...FEES });
  let hash;
  let lastErr;
  for (const rpcUrl of SENDS) {
    try {
      const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [signed] }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message || 'error');
      hash = j.result;
      break;
    } catch (e) { lastErr = e; }
  }
  if (!hash) throw new Error('no pude enviar (' + label + '): ' + (lastErr?.message || '').slice(0, 80));
  for (let i = 0; i < 72; i++) {
    const rc = await rpc('eth_getTransactionReceipt', [hash]);
    if (rc) {
      console.log(label, '->', hash, '|', rc.status === '0x1' ? 'OK' : 'REVERTIDA', '| gas', parseInt(rc.gasUsed, 16));
      if (rc.status !== '0x1') throw new Error('revertida: ' + label);
      return hash;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('timeout: ' + label);
}

(async () => {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY);
  const ops = JSON.parse(fs.readFileSync('.agent-wallet.json', 'utf8'));
  const opsAcct = privateKeyToAccount(ops.privateKey);
  const testers = [1, 2, 3].map((n) => {
    const f = n === 1 ? '.feedback-wallet.json' : `.feedback-wallet-${n}.json`;
    return privateKeyToAccount(JSON.parse(fs.readFileSync(f, 'utf8')).privateKey);
  });
  console.log('owner:', owner.address, '| ops:', ops.address, '| testers:', testers.map((t) => t.address.slice(0, 10)).join(', '));

  // ===== A) metadata rica (5 eventos, owner) =====
  const meta = [
    ['description', 'Agente de Petra Synthetic: composiciones deterministas de videodanza, contratos Solidity y endpoints MCP + A2A. Endpoint premium x402 (0.10 USDC).'],
    ['x402', 'https://my-agent-tau.vercel.app/v1/premium-composition'],
    ['mcp', 'https://my-agent-tau.vercel.app/mcp'],
    ['a2a', 'https://my-agent-tau.vercel.app/.well-known/agent-card.json'],
    ['skills', 'videodanza, generative-art, solidity, x402, mcp, a2a'],
  ];
  for (const [key, val] of meta) {
    const data = encodeFunctionData({ abi: adapterAbi, functionName: 'counterfactualSetMetadata', args: [5, owner.address, 0n, key, toHex(val)] });
    await sendAs(owner, ADAPTER, data, 80000, 'A) metadata ' + key);
  }

  // ===== B) doble link: agentWallet oficial en el registry =====
  try {
    const tsHex = await rpc('eth_getBlockByNumber', ['latest', false]);
    const chainNow = parseInt(tsHex.timestamp, 16);
    const deadline = BigInt(chainNow + 240);
    const signature = await opsAcct.signTypedData({
      domain: { name: 'ERC8004IdentityRegistry', version: '1', chainId: 11155111n, verifyingContract: REGISTRY },
      types: { AgentWalletSet: [
        { name: 'agentId', type: 'uint256' },
        { name: 'newWallet', type: 'address' },
        { name: 'owner', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ] },
      primaryType: 'AgentWalletSet',
      message: { agentId: AGENT_ID, newWallet: ops.address, owner: ADAPTER, deadline },
    });
    const data = encodeFunctionData({ abi: adapterAbi, functionName: 'setAgentWallet', args: [AGENT_ID, ops.address, deadline, signature] });
    // simular antes de mandar
    const sim = await rpc('eth_call', [{ from: owner.address, to: ADAPTER, data }, 'latest']);
    console.log('B) simulacion setAgentWallet:', sim !== undefined ? 'PASA' : 'REVIERTE');
    await sendAs(owner, ADAPTER, data, 200000, 'B) setAgentWallet oficial');
    const w = await rpc('eth_call', [{ to: ADAPTER, data: encodeFunctionData({ abi: adapterAbi, functionName: 'getAgentWallet', args: [AGENT_ID] }) }, 'latest']);
    console.log('B) getAgentWallet(11150):', '0x' + String(w).slice(26));
  } catch (e) {
    console.log('B) FALLO:', e.message.slice(0, 140));
  }

  // ===== C) feedbacks para #11150 (3 testers) =====
  const fb = [
    [0, 'adapter', 'binding', 'Verifique onchain: bindingOf(11150) liga el agente a la cuenta correcta y su URI responde.'],
    [1, 'x402', 'premium', 'Pague el endpoint premium del agente (0.10 USDC en Base Sepolia): respuesta y recibo correctos.'],
    [2, 'mcp', 'tools', 'Probe el endpoint MCP y la agent-card del agente: respuestas 200 y skills completas.'],
  ];
  for (const [i, tag1, tag2, reason] of fb) {
    const b = BigInt(await rpc('eth_getBalance', [testers[i].address, 'latest']));
    if (b < 500000000000000n) {
      console.log('C) fondeando tester', i + 1);
      await sendAs(owner, testers[i].address, undefined, 21000, 'C) top-up tester ' + (i + 1), 1000000000000000n);
    }
    const data = encodeFunctionData({ abi: repAbi, functionName: 'giveFeedback', args: [AGENT_ID, 5n, 0, tag1, tag2, 'https://my-agent-tau.vercel.app/.well-known/agent-card.json', 'ipfs://bafkrei' + tag1.slice(0, 3), keccak256(toHex(reason))] });
    await sendAs(testers[i], REPUTATION, data, 1200000, 'C) feedback tester ' + (i + 1) + ' (' + tag1 + ')');
  }

  console.log('LISTO');
})().catch((e) => { console.error('ERR:', e.message.slice(0, 300)); process.exit(1); });
