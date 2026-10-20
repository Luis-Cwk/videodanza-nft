// Completa el registro mainnet (idempotente): setAgentWallet (ops) + metadata name, con RPC rotativo.
require('dotenv').config();
const fs = require('fs');
const { encodeFunctionData, parseAbi, decodeAbiParameters, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432';
const AGENT_ID = 356966n;
const RPCS = ['https://1rpc.io/base', 'https://base.llamarpc.com', 'https://base.gateway.tenderly.co'];
const CHAIN_ID = 8453;
const FEES = { maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 5000000n };

const abi = parseAbi([
  'function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)',
  'function setMetadata(uint256 agentId, string key, bytes value)',
  'function getMetadata(uint256 agentId, string key) view returns (bytes)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]);

async function call(rpcUrl, method, params) {
  const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message.slice(0, 80));
  return j.result;
}
async function callAny(method, params) {
  let last;
  for (const url of RPCS) {
    try { return await call(url, method, params); } catch (e) { last = e; }
  }
  throw last;
}
async function readMeta(key) {
  const raw = await callAny('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi, functionName: 'getMetadata', args: [AGENT_ID, key] }) }, 'latest']);
  try {
    const d = decodeAbiParameters([{ type: 'bytes' }], raw)[0];
    return Buffer.from(d.slice(2), 'hex').toString('utf8');
  } catch { return ''; }
}

async function sendWait(to, data, gas, label) {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY);
  const nonce = parseInt(await callAny('eth_getTransactionCount', [owner.address, 'pending']), 16);
  const signed = await owner.signTransaction({ to, data, gas: BigInt(gas), nonce, chainId: CHAIN_ID, ...FEES });
  let hash = null;
  for (const url of RPCS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [signed] }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      hash = j.result;
      break;
    } catch (e) { /* siguiente */ }
  }
  if (!hash) throw new Error('no se pudo enviar: ' + label);
  console.log(label, 'tx:', hash);
  for (let i = 0; i < 60; i += 1) {
    await new Promise((r) => setTimeout(r, 3000));
    try {
      const rc = await callAny('eth_getTransactionReceipt', [hash]);
      if (rc) {
        console.log(label, 'status:', rc.status === '0x1' ? 'OK' : 'REVERTIDA', '| gas', parseInt(rc.gasUsed, 16));
        if (rc.status !== '0x1') throw new Error('revertida: ' + label);
        return;
      }
    } catch (e) { /* rate limit: seguimos esperando */ }
  }
  console.log(label, 'sin recibo aun; verificar estado despues');
}

(async () => {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY);
  const ops = JSON.parse(fs.readFileSync('.agent-wallet.json', 'utf8'));
  const opsAcct = privateKeyToAccount(ops.privateKey);

  let wallet = await readMeta('agentWallet');
  console.log('agentWallet actual:', wallet || '(vacio)');
  if (wallet.toLowerCase() !== ops.address.toLowerCase()) {
    const block = await callAny('eth_getBlockByNumber', ['latest', false]);
    const deadline = BigInt(parseInt(block.timestamp, 16) + 240);
    const signature = await opsAcct.signTypedData({
      domain: { name: 'ERC8004IdentityRegistry', version: '1', chainId: 8453n, verifyingContract: REGISTRY },
      types: { AgentWalletSet: [
        { name: 'agentId', type: 'uint256' },
        { name: 'newWallet', type: 'address' },
        { name: 'owner', type: 'address' },
        { name: 'deadline', type: 'uint256' },
      ] },
      primaryType: 'AgentWalletSet',
      message: { agentId: AGENT_ID, newWallet: ops.address, owner: owner.address, deadline },
    });
    await sendWait(REGISTRY, encodeFunctionData({ abi, functionName: 'setAgentWallet', args: [AGENT_ID, ops.address, deadline, signature] }), 200000, 'setAgentWallet');
  } else {
    console.log('agentWallet ya es la ops; no reenvio');
  }

  let name = await readMeta('name');
  console.log('name actual:', name || '(vacio)');
  if (name !== 'entropiav2') {
    await sendWait(REGISTRY, encodeFunctionData({ abi, functionName: 'setMetadata', args: [AGENT_ID, 'name', toHex('entropiav2')] }), 120000, 'setMetadata name');
  } else {
    console.log('name ya esta; no reenvio');
  }

  wallet = await readMeta('agentWallet');
  name = await readMeta('name');
  const uriRaw = await callAny('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi, functionName: 'tokenURI', args: [AGENT_ID] }) }, 'latest']);
  const uri = decodeAbiParameters([{ type: 'string' }], uriRaw)[0];
  console.log('\n=== VERIFICACION ===');
  console.log('agentWallet:', wallet);
  console.log('name:', name);
  console.log('tokenURI:', uri);
  console.log('LISTO');
})().catch((e) => { console.error('ERR:', (e.shortMessage || e.message).slice(0, 300)); process.exit(1); });
