// Registro del agente en Base MAINNET (ERC-8004) + agentWallet de la wallet operativa.
// Uso: node scripts/register-mainnet.cjs
// Requiere: PRIVATE_KEY (owner) con ETH en Base y .agent-wallet.json.
const fs = require('fs');
const { encodeFunctionData, parseAbi, decodeEventLog, decodeAbiParameters, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const REGISTRY = '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432'; // Base mainnet
const URI = 'https://my-agent-tau.vercel.app/agent-registration-mainnet.json';
const RPC = 'https://base-rpc.publicnode.com';
const SENDS = ['https://base-rpc.publicnode.com', 'https://mainnet.base.org'];
const CHAIN_ID = 8453;
const FEES = { maxFeePerGas: 1000000000n, maxPriorityFeePerGas: 5000000n }; // cap 1 gwei (efectivo ~0.006 gwei)

const abi = parseAbi([
  'function register(string agentURI) returns (uint256)',
  'function setAgentWallet(uint256 agentId, address newWallet, uint256 deadline, bytes signature)',
  'function setMetadata(uint256 agentId, string key, bytes value)',
  'function eip712Domain() view returns (bytes1 fields, string name, string version, uint256 chainId, address verifyingContract, bytes32 salt, uint256[] extensions)',
]);
const transferAbi = parseAbi(['event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)']);

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
  for (const url of SENDS) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [signed] }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      hash = j.result;
      break;
    } catch (e) { /* siguiente rpc */ }
  }
  if (!hash) throw new Error('no se pudo enviar: ' + label);
  for (let i = 0; i < 90; i++) {
    const rc = await rpc('eth_getTransactionReceipt', [hash]);
    if (rc) {
      console.log(label, '->', hash, '|', rc.status === '0x1' ? 'OK' : 'REVERTIDA', '| gas', parseInt(rc.gasUsed, 16));
      if (rc.status !== '0x1') throw new Error('revertida: ' + label);
      return rc;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error('timeout: ' + label);
}

(async () => {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY);
  const ops = JSON.parse(fs.readFileSync('.agent-wallet.json', 'utf8'));
  const opsAcct = privateKeyToAccount(ops.privateKey);
  console.log('owner:', owner.address, '| ops:', ops.address);

  const bal = BigInt(await rpc('eth_getBalance', [owner.address, 'latest']));
  console.log('ETH owner en Base:', (Number(bal) / 1e18).toFixed(6));
  if (bal < 300000000000000n) {
    console.log('OJO: balance bajo para el gas (se recomiendan >= 0.0003 ETH). Abortando sin enviar.');
    return;
  }

  // 1. registrar (simular primero para validar ABI y ver el agentId esperado)
  const data = encodeFunctionData({ abi, functionName: 'register', args: [URI] });
  const sim = await rpc('eth_call', [{ from: owner.address, to: REGISTRY, data }, 'latest']);
  console.log('simulacion register: PASA, agentId esperado:', parseInt(sim, 16));
  const rc = await sendAs(owner, REGISTRY, data, 600000, 'register mainnet');

  // 2. agentId desde el log Transfer (mint desde 0x0)
  let agentId = null;
  for (const log of rc.logs) {
    try {
      const d = decodeEventLog({ abi: transferAbi, data: log.data, topics: log.topics });
      if (d.eventName === 'Transfer' && d.args.from === '0x0000000000000000000000000000000000000000') agentId = d.args.tokenId;
    } catch { /* otro evento */ }
  }
  if (agentId === null) throw new Error('no pude leer el agentId del recibo');
  console.log('agentId mainnet:', agentId.toString());

  // 3. agentWallet = wallet operativa (firma EIP-712 de la ops; owner del mensaje = owner)
  const domain = { name: 'ERC8004IdentityRegistry', version: '1', chainId: 8453n, verifyingContract: REGISTRY };
  try {
    const raw = await rpc('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi, functionName: 'eip712Domain' }) }, 'latest']);
    const dec = decodeAbiParameters(
      [{ type: 'bytes1' }, { type: 'string' }, { type: 'string' }, { type: 'uint256' }, { type: 'address' }, { type: 'bytes32' }, { type: 'uint256[]' }],
      raw,
    );
    if (dec[1]) domain.name = dec[1];
    if (dec[2]) domain.version = dec[2];
  } catch { /* usa defaults */ }
  const block = await rpc('eth_getBlockByNumber', ['latest', false]);
  const deadline = BigInt(parseInt(block.timestamp, 16) + 240);
  const signature = await opsAcct.signTypedData({
    domain,
    types: { AgentWalletSet: [
      { name: 'agentId', type: 'uint256' },
      { name: 'newWallet', type: 'address' },
      { name: 'owner', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ] },
    primaryType: 'AgentWalletSet',
    message: { agentId, newWallet: ops.address, owner: owner.address, deadline },
  });
  await sendAs(owner, REGISTRY, encodeFunctionData({ abi, functionName: 'setAgentWallet', args: [agentId, ops.address, deadline, signature] }), 200000, 'setAgentWallet');

  // 4. metadata name
  await sendAs(owner, REGISTRY, encodeFunctionData({ abi, functionName: 'setMetadata', args: [agentId, 'name', toHex('entropiav2')] }), 120000, 'setMetadata name');

  console.log('\nLISTO. Agrega en public/agent-registration-mainnet.json:');
  console.log(`"registrations": [{ "agentId": ${agentId}, "agentRegistry": "eip155:8453:${REGISTRY}" }]`);
  console.log('(y redeploy para que el JSON hosteado quede consistente)');
})().catch((e) => { console.error('ERR:', (e.shortMessage || e.message).slice(0, 300)); process.exit(1); });
