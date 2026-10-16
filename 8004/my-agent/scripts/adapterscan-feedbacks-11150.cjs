require('dotenv').config();
const fs = require('fs');
const { encodeFunctionData, parseAbi, keccak256, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const REPUTATION = '0x8004B663056A597Dffe9eCcC1965A193B7388713';
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const SENDS = ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'];
const CHAIN_ID = 11155111;
const FEES = { maxFeePerGas: 6000000000n, maxPriorityFeePerGas: 1000000000n };
const EP = 'https://my-agent-tau.vercel.app/.well-known/agent-card.json';

const repAbi = parseAbi([
  'function giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)',
]);

async function rpc(method, params) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(method + ': ' + (j.error.message || ''));
  return j.result;
}

async function sendAs(account, to, data, gas, label) {
  const nonce = parseInt(await rpc('eth_getTransactionCount', [account.address, 'pending']), 16);
  const signed = await account.signTransaction({ to, data, gas: BigInt(gas), nonce, chainId: CHAIN_ID, ...FEES });
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
      console.log(label, '->', hash, '|', rc.status === '0x1' ? 'OK' : 'REVERTIDA', '| gasUsed', parseInt(rc.gasUsed, 16));
      if (rc.status !== '0x1') throw new Error('revertida: ' + label);
      return hash;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('timeout: ' + label);
}

(async () => {
  // referencia: gasUsed de un feedback viejo a 2387
  const old = await rpc('eth_getTransactionReceipt', ['0x9d65de471582def9fefe919013ad29cedae2da0cb8fe0960f7086c879eba4c63']);
  console.log('(referencia: feedback viejo a 2387 gasUsed:', old ? parseInt(old.gasUsed, 16) : 'no encontrado', ')');

  const testers = [1, 2, 3].map((n) => {
    const f = n === 1 ? '.feedback-wallet.json' : `.feedback-wallet-${n}.json`;
    return privateKeyToAccount(JSON.parse(fs.readFileSync(f, 'utf8')).privateKey);
  });

  const fb = [
    [0, 'adapter', 'binding', 'Verifique onchain: bindingOf(11150) liga el agente a la cuenta correcta y su URI responde.'],
    [1, 'x402', 'premium', 'Pague el endpoint premium del agente (0.10 USDC en Base Sepolia): respuesta y recibo correctos.'],
    [2, 'mcp', 'tools', 'Probe el endpoint MCP y la agent-card del agente: respuestas 200 y skills completas.'],
  ];
  for (const [i, tag1, tag2, reason] of fb) {
    const data = encodeFunctionData({ abi: repAbi, functionName: 'giveFeedback', args: [11150n, 5n, 0, tag1, tag2, EP, 'ipfs://bafkrei' + tag1.slice(0, 3), keccak256(toHex(reason))] });
    const bal = BigInt(await rpc('eth_getBalance', [testers[i].address, 'latest']));
    console.log('tester', i + 1, 'balance:', (Number(bal) / 1e18).toFixed(5));
    await sendAs(testers[i], REPUTATION, data, 1200000, 'feedback tester ' + (i + 1) + ' (' + tag1 + ')');
  }
  console.log('LISTO');
})().catch((e) => { console.error('ERR:', e.message.slice(0, 300)); process.exit(1); });
