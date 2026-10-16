// Registro ERC-8004 completo de la identidad de cuenta (standard 5, owner).
// Incluye metadata name=entropiav2 en la misma tx. Firma local + raw send.
require('dotenv').config();
const { encodeFunctionData, parseAbi, toHex } = require('viem');
const { privateKeyToAccount } = require('viem/accounts');

const ADAPTER = '0x7621630cB63a73a194f45A3E6801B8C6A7eC2f92';
const REGISTRY = '0x8004A818BFB912233c491871b3d84c89A494BD9e';
const RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
const SENDS = ['https://ethereum-sepolia-rpc.publicnode.com', 'https://sepolia.drpc.org'];
const CHAIN_ID = 11155111;
const URI = 'ipfs://bafkreige6747i6vnnosopgrdnnu2fm7uow4w4lvyjjsfskfza5ui73mpa4';
const FEES = { maxFeePerGas: 6000000000n, maxPriorityFeePerGas: 1000000000n };

const abi = parseAbi([
  'function register(uint8 standard, address boundAddress, uint256 tokenId, string agentURI, (string metadataKey, bytes metadataValue)[] metadata) returns (uint256)',
  'function bindingOf(uint256 agentId) view returns (uint8 standard, address tokenContract, uint256 tokenId)',
]);
const erc721Abi = parseAbi([
  'function ownerOf(uint256 tokenId) view returns (address)',
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
  const data = encodeFunctionData({
    abi, functionName: 'register',
    args: [5, owner.address, 0n, URI, [{ metadataKey: 'name', metadataValue: toHex('entropiav2') }]],
  });

  const nonce = parseInt(await rpc('eth_getTransactionCount', [owner.address, 'pending']), 16);
  const signed = await owner.signTransaction({ to: ADAPTER, data, gas: 1400000n, nonce, chainId: CHAIN_ID, ...FEES });
  let hash;
  for (const rpcUrl of SENDS) {
    try {
      const r = await fetch(rpcUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_sendRawTransaction', params: [signed] }) });
      const j = await r.json();
      if (j.error) throw new Error(j.error.message);
      hash = j.result;
      break;
    } catch (e) {
      console.log('send fallo en', rpcUrl.split('/')[2], ':', e.message.slice(0, 60));
    }
  }
  if (!hash) throw new Error('no se pudo enviar');
  console.log('register full tx:', hash);

  let rc;
  for (let i = 0; i < 72; i++) {
    rc = await rpc('eth_getTransactionReceipt', [hash]);
    if (rc) break;
    await new Promise((r) => setTimeout(r, 5000));
  }
  if (!rc) throw new Error('sin recibo');
  console.log('status:', rc.status, '| bloque', parseInt(rc.blockNumber, 16), '| gasUsed', parseInt(rc.gasUsed, 16), '| logs', rc.logs.length);

  // verificar el nuevo agente
  const agentId = 11150n;
  const ownerOf = await rpc('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi: erc721Abi, functionName: 'ownerOf', args: [agentId] }) }, 'latest']);
  console.log('ownerOf(11150) en el registry:', '0x' + String(ownerOf).slice(26));
  const binding = await rpc('eth_call', [{ to: ADAPTER, data: encodeFunctionData({ abi, functionName: 'bindingOf', args: [agentId] }) }, 'latest']);
  console.log('bindingOf(11150):', binding);
  const uri = await rpc('eth_call', [{ to: REGISTRY, data: encodeFunctionData({ abi: erc721Abi, functionName: 'tokenURI', args: [agentId] }) }, 'latest']);
  console.log('tokenURI(11150):', Buffer.from(String(uri).slice(2 + 64 * 2), 'hex').toString('utf8').slice(0, 80));
  console.log('LISTO');
})().catch((e) => { console.error('ERR:', e.message.slice(0, 300)); process.exit(1); });
