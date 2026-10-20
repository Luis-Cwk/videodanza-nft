// Comprador mainnet: paga 0.10 USDC reales por la composicion premium y verifica el recibo.
// Uso: node scripts/x402-buyer-mainnet-test.cjs
require('dotenv').config();
const fs = require('fs');
const { wrapFetchWithPayment } = require('x402-fetch');
const { createWalletClient, createPublicClient, http, parseAbi } = require('viem');
const { base } = require('viem/chains');
const { privateKeyToAccount } = require('viem/accounts');

const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const OPS = '0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f';
const RPC = 'https://base-rpc.publicnode.com';
const erc20 = parseAbi(['function balanceOf(address) view returns (uint256)']);

(async () => {
  const pub = createPublicClient({ chain: base, transport: http(RPC) });
  const buyer = privateKeyToAccount(JSON.parse(fs.readFileSync('.buyer-mainnet.json', 'utf8')).privateKey);
  const bal = await pub.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [buyer.address] });
  const opsBefore = await pub.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [OPS] });
  console.log('comprador:', buyer.address, '| USDC:', Number(bal) / 1e6);
  console.log('wallet del agente USDC antes:', Number(opsBefore) / 1e6);
  if (bal < 100000n) {
    console.log('SIN USDC suficiente (se requieren 0.10). Fondea la wallet del comprador y reintenta.');
    return;
  }

  const wallet = createWalletClient({ account: buyer, chain: base, transport: http(RPC) });
  const payFetch = wrapFetchWithPayment(fetch, wallet);
  const r = await payFetch('https://my-agent-tau.vercel.app/v1/premium-composition?seed=primera-venta-real&mood=euforia');
  console.log('llamada pagada status:', r.status);
  const txt = await r.text();
  console.log('respuesta:', txt.slice(0, 200));
  const receipt = r.headers.get('x-payment-response');
  if (receipt) console.log('recibo:', Buffer.from(receipt, 'base64').toString('utf8').slice(0, 260));
  await new Promise((res) => setTimeout(res, 4000));
  const opsAfter = await pub.readContract({ address: USDC, abi: erc20, functionName: 'balanceOf', args: [OPS] });
  console.log('wallet del agente USDC despues:', Number(opsAfter) / 1e6);
})().catch((e) => { console.error('ERR:', (e.shortMessage || e.message).slice(0, 250)); process.exit(1); });
