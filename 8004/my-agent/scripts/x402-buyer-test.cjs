// Comprador x402: tester paga la llamada premium; verifica que el USDC llegue a la wallet del agente.
require('dotenv').config();
const fs = require('fs');
const { wrapFetchWithPayment } = require('x402-fetch');
const { createWalletClient, createPublicClient, http, parseAbi } = require('viem');
const { baseSepolia } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const USDC = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
const OPS = '0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f';
const RPC = 'https://sepolia.base.org';
const erc20 = parseAbi(['function balanceOf(address) view returns (uint256)']);

(async () => {
  const pub = createPublicClient({ chain: baseSepolia, transport: http(RPC) });
  const testers = [1, 2, 3].map((n) => privateKeyToAccount(JSON.parse(fs.readFileSync(n === 1 ? '.feedback-wallet.json' : `.feedback-wallet-${n}.json`, 'utf8')).privateKey));

  let buyer = null;
  for (const t of testers) {
    const b = await pub.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [t.address] });
    console.log('tester', t.address.slice(0, 10), 'USDC:', Number(b) / 1e6);
    if (!buyer && b >= 100000n) buyer = t;
  }
  const opsBefore = await pub.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [OPS] });
  console.log('ops USDC antes:', Number(opsBefore) / 1e6);
  if (!buyer) { console.log('SIN tester con USDC >= 0.10'); return; }
  console.log('comprador:', buyer.address.slice(0, 10));

  const wallet = createWalletClient({ account: buyer, chain: baseSepolia, transport: http(RPC) });
  const payFetch = wrapFetchWithPayment(fetch, wallet);
  const r = await payFetch('https://my-agent-tau.vercel.app/v1/premium-composition?seed=bazaar-demo-1&mood=melancolia');
  console.log('status llamada pagada:', r.status);
  const txt = await r.text();
  console.log('respuesta:', txt.slice(0, 220));
  const receipt = r.headers.get('x-payment-response');
  if (receipt) {
    const dec = JSON.parse(Buffer.from(receipt, 'base64').toString('utf8'));
    console.log('recibo:', JSON.stringify(dec).slice(0, 300));
  }
  const opsAfter = await pub.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [OPS] });
  console.log('ops USDC despues:', Number(opsAfter) / 1e6);
})().catch((e) => { console.error('ERR:', (e.shortMessage || e.message).slice(0, 250)); process.exit(1); });
