// Paga /v1/premium-composition con el cliente x402 v2.
// Uso: node scripts/pay-premium.mjs [wallet.json] [query]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';
import { wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const walletFile = process.argv[2] || '.buyer-emailtest.json';
const query = process.argv[3] || 'seed=premium-v2-prueba';
const raw = JSON.parse(readFileSync(new URL(`../${walletFile}`, import.meta.url), 'utf8'));
const pk = raw.privateKey || raw.private_key || raw.key || raw.pk;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
console.log('pagador:', account.address);

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const url = `https://entropia.petrasynthetic.com/v1/premium-composition?${query}`;
const t0 = Date.now();
const res = await fetchWithPayment(url);
const body = await res.json().catch(() => null);
const header = res.headers.get('payment-response');
const receipt = header ? decodePaymentResponseHeader(header) : null;

console.log(JSON.stringify({
  status: res.status,
  ms: Date.now() - t0,
  receipt,
  seed: body?.composition?.seed ?? null,
  deterministic: body?.deterministic ?? null,
  tiene_curatorial: Boolean(body?.curatorial_text),
}, null, 1));
