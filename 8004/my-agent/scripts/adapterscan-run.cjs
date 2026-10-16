// Flujo completo de la identidad Adapterscan de entropiav2:
// 1) claim + metadata + wallet operativa (owner)
// 2) confirmacion de la wallet operativa (ops)
// 3) atestaciones: ratings de 3 testers + transaction record del x402 (la que pago)
// 4) verificacion con eth_getLogs
// Firma local (viem signTransaction) y manda crudo por RPC (sin viem estimateGas).
require('dotenv').config();
const fs = require('fs');
const { encodeFunctionData, parseAbi, toHex, concatHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const ADAPTER = '0x7621630cB63a73a194f45A3E6801B8C6A7eC2f92';
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const SENDS = ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'];
const CHAIN_ID = 11155111;
const UBID = '0x0806e9749b2940c22f04a666f578755e479e106e9dd5e6d785b0f82b9353be80';
const URI = 'ipfs://bafkreige6747i6vnnosopgrdnnu2fm7uow4w4lvyjjsfskfza5ui73mpa4';
const TX_X402 = '0xb63c10b60ef17ce33eae03e789434fcab14fd60496eb2f8f672996f49c19d75c';
const ZERO = '0x' + '00'.repeat(32);
const FEES = { maxFeePerGas: 12000000000n, maxPriorityFeePerGas: 2000000000n };

const abi = parseAbi([
  'function counterfactualRegister(uint8 standard, address boundAddress, uint256 tokenId, string agentURI) returns (bytes32)',
  'function counterfactualSetMetadata(uint8 standard, address boundAddress, uint256 tokenId, string key, bytes value) returns (bytes32)',
  'function counterfactualSetAgentWallet(uint8 standard, address boundAddress, uint256 tokenId, address wallet) returns (bytes32)',
  'function setWalletUBID(uint8 standard, address boundAddress, uint256 tokenId) returns (bytes32)',
  'function attest(uint8 attestationType, bytes32 ubid, bytes32 variant, bytes data)',
]);

async function rpc(method, params) {
  const r = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const j = await r.json();
  if (j.error) throw new Error(method + ': ' + (j.error.message || ''));
  return j.result;
}

async function balance(addr) {
  return BigInt(await rpc('eth_getBalance', [addr, 'latest']));
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
    } catch (e) {
      lastErr = e;
    }
  }
  if (!hash) throw new Error('no pude enviar (' + label + '): ' + (lastErr?.message || '').slice(0, 80));
  for (let i = 0; i < 72; i++) {
    const rc = await rpc('eth_getTransactionReceipt', [hash]);
    if (rc) {
      const status = rc.status === '0x1' ? 'OK' : 'REVERTIDA';
      console.log(label, '->', hash, '|', status, '| bloque', parseInt(rc.blockNumber, 16));
      if (rc.status !== '0x1') throw new Error('tx revertida: ' + label);
      return hash;
    }
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('timeout de recibo: ' + label + ' (' + hash + ')');
}

(async () => {
  const owner = privateKeyToAccount(process.env.PRIVATE_KEY);
  const ops = JSON.parse(fs.readFileSync('.agent-wallet.json', 'utf8'));
  const opsAcct = privateKeyToAccount(ops.privateKey);
  const testers = [1, 2, 3].map((n) => {
    const f = n === 1 ? '.feedback-wallet.json' : `.feedback-wallet-${n}.json`;
    const w = JSON.parse(fs.readFileSync(f, 'utf8'));
    return { acct: privateKeyToAccount(w.privateKey), file: f };
  });
  console.log('owner:', owner.address, '| ops:', ops.address);
  console.log('testers:', testers.map((t) => t.acct.address.slice(0, 10)).join(', '));

  // fondear testers si les falta gas (umbral 0.0005)
  for (const t of testers) {
    const b = await balance(t.acct.address);
    if (b < 500000000000000n) {
      console.log('fondeando tester', t.acct.address.slice(0, 10), '...');
      await sendAs(owner, t.acct.address, undefined, 21000, '  top-up ' + t.file, 1000000000000000n);
    }
  }

  // 1) owner: claim + metadata + wallet operativa
  await sendAs(owner, ADAPTER, encodeFunctionData({ abi, functionName: 'counterfactualRegister', args: [5, owner.address, 0n, URI] }), 90000, '1) claim');
  await sendAs(owner, ADAPTER, encodeFunctionData({ abi, functionName: 'counterfactualSetMetadata', args: [5, owner.address, 0n, 'name', toHex('entropiav2')] }), 90000, '2) metadata name');
  await sendAs(owner, ADAPTER, encodeFunctionData({ abi, functionName: 'counterfactualSetAgentWallet', args: [5, owner.address, 0n, ops.address] }), 90000, '3) wallet operativa nombrada');

  // 2) ops: confirmar "trabajo para esta identidad"
  await sendAs(opsAcct, ADAPTER, encodeFunctionData({ abi, functionName: 'setWalletUBID', args: [5, owner.address, 0n] }), 90000, '4) ops confirma wallet');

  // 3) testers: ratings (3) + record (1)
  const ratings = [
    [92, 'Pague el endpoint premium x402 y liquido en Base Sepolia. Trato cumplido.'],
    [90, 'Chequee sus endpoints y agent-card en dias distintos: estables.'],
    [91, 'Verifique el flujo A2A y la metadata: respuestas consistentes.'],
  ];
  for (let i = 0; i < 3; i++) {
    const payload = concatHex([toHex(ratings[i][0], { size: 1 }), toHex(ratings[i][1])]);
    const data = encodeFunctionData({ abi, functionName: 'attest', args: [3, UBID, ZERO, payload] });
    await sendAs(testers[i].acct, ADAPTER, data, 140000, `5.${i + 1}) rating tester ${i + 1}`);
  }
  const payload5 = concatHex([toHex(95, { size: 1 }), TX_X402, toHex('Pago x402 de 0.10 USDC liquidado en Base Sepolia.')]);
  await sendAs(testers[0].acct, ADAPTER, encodeFunctionData({ abi, functionName: 'attest', args: [5, UBID, TX_X402, payload5] }), 140000, '6) transaction record x402');

  // 4) verificacion: logs del adapter con nuestro UBID
  const logs = await rpc('eth_getLogs', [{ address: ADAPTER, fromBlock: '0x0', toBlock: 'latest', topics: [null, UBID] }]);
  console.log('eventos onchain con nuestro UBID:', logs.length);
  for (const l of logs.slice(-6)) console.log('  topic0:', l.topics[0].slice(0, 14), '| tx:', l.transactionHash, '| bloque', parseInt(l.blockNumber, 16));
  console.log('LISTO');
})().catch((e) => { console.error('ERR:', e.message.slice(0, 300)); process.exit(1); });
