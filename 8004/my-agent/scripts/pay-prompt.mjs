// Paga POST /v1/prompt/analyze con el cliente x402 v2.
// Uso: node pay-prompt.mjs <wallet.json> <image_url>
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';
import { wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const walletFile = process.argv[2] || '.buyer-emailtest.json';
const imageUrl = process.argv[3];
if (!imageUrl) { console.log('falta image_url'); process.exit(1); }

const raw = JSON.parse(readFileSync(new URL(`../${walletFile}`, import.meta.url), 'utf8'));
const pk = raw.privateKey || raw.private_key || raw.key || raw.pk;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
console.log('pagador:', account.address);

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const t0 = Date.now();
const res = await fetchWithPayment('https://entropia.petrasynthetic.com/v1/prompt/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ image_url: imageUrl }),
});
const body = await res.json().catch(() => null);
const header = res.headers.get('payment-response');
const receipt = header ? decodePaymentResponseHeader(header) : null;

console.log(JSON.stringify({ status: res.status, ms: Date.now() - t0, receipt }, null, 1));
if (body) console.log(JSON.stringify(body, null, 1).slice(0, 1600));
