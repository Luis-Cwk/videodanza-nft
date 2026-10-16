// Actualiza el agentURI del #2387 a la URL HTTPS con el registro hosteado.
require('dotenv').config();
const { encodeFunctionData, parseAbi } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const NEW_URI = 'https://my-agent-tau.vercel.app/agent-registration.json';
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const SENDS = ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'];
const CHAIN_ID = 11155111;
const FEES = { maxFeePerGas: 6000000000n, maxPriorityFeePerGas: 1000000000n };

const abi = parseAbi([
  'function setAgentURI(uint256 agentId, string newURI)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]);

async function rpc(method, params) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(method + ': ' + (j.error.message || ''));
  return j.result;
}

(async () => {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY);
  const before = await rpc('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi, functionName: 'tokenURI', args: [2387n] }) }, 'latest']);
  console.log('URI antes:', Buffer.from(String(before).slice(2 + 128), 'hex').toString('utf8').slice(0, 80));

  const data = encodeFunctionData({ abi, functionName: 'setAgentURI', args: [2387n, NEW_URI] });
  const sim = await rpc('eth_call', [{ from: owner.address, to: REGISTRY, data }, 'latest']);
  console.log('simulacion:', sim !== undefined ? 'PASA' : 'REVIERTE');

  const nonce = parseInt(await rpc('eth_getTransactionCount', [owner.address, 'pending']), 16);
  const signed = await owner.signTransaction({ to: REGISTRY, data, gas: 120000n, nonce, chainId: CHAIN_ID, ...FEES });
  let hash;
  for (const rpcUrl of SENDS) {
    try {
      const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [signed] }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      hash = j.result;
      break;
    } catch (e) { console.log('send fallo en', rpcUrl.split('/')[2]); }
  }
  if (!hash) throw new Error('no se pudo enviar');
  console.log('tx:', hash);
  let rc;
  for (let i = 0; i < 72; i++) {
    rc = await rpc('eth_getTransactionReceipt', [hash]);
    if (rc) break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  console.log('status:', rc?.status === '0x1' ? 'OK' : rc?.status, '| gas', rc ? parseInt(rc.gasUsed, 16) : '?');

  const after = await rpc('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi, functionName: 'tokenURI', args: [2387n] }) }, 'latest']);
  console.log('URI despues:', Buffer.from(String(after).slice(2 + 128), 'hex').toString('utf8').slice(0, 80));
})().catch((e) => { console.error('ERR:', e.message.slice(0, 250)); process.exit(1); });
