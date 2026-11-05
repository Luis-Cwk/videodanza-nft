// Primera compra x402 en Base mainnet con la wallet compradora propia.
// Objetivo: recibo settled real para publicar y para dar historial a la agentWallet.
import 'dotenv/config';
import { readFileSync, writeFileSync } from 'node:fs';

const URL_PAGO = 'https://entropia.petrasynthetic.com/v1/premium-composition';
const raw = JSON.parse(readFileSync(new URL('../.buyer-mainnet.json', import.meta.url), 'utf8'));
const pk = raw.privateKey || raw.private_key || raw.key || raw.pk;

const { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } = await import('x402-fetch');
const signer = await createSigner('base', pk.startsWith('0x') ? pk : `0x${pk}`);
const fetchWithPayment = wrapFetchWithPayment(fetch, signer);

const t0 = Date.now();
const res = await fetchWithPayment(URL_PAGO);
const body = await res.json().catch(() => null);
const receipt = decodeXPaymentResponse(res.headers.get('x-payment-response'));

console.log(JSON.stringify({
  status: res.status,
  ms: Date.now() - t0,
  receipt,
  seed: body?.composition?.seed ?? body?.seed ?? null,
  titulo: body?.composition?.titulo ?? body?.titulo ?? null,
}, null, 1));

if (receipt) writeFileSync(new URL('../.x402-receipt-mainnet.json', import.meta.url), JSON.stringify({ receipt, body }, null, 2));
