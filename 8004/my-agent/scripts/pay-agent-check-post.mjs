// Compra de prueba con POST y body camelCase {agentId}, para verificar que el
// endpoint normaliza el nombre del campo. Usa la wallet compradora.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';
import { wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const raw = JSON.parse(readFileSync(new URL('../.buyer-mainnet.json', import.meta.url), 'utf8'));
const pk = raw.privateKey || raw.private_key || raw.key || raw.pk;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const t0 = Date.now();
const res = await fetchWithPayment('https://entropia.petrasynthetic.com/v1/agent-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ agentId: '356966', chainId: '8453' }),
});
const body = await res.json().catch(() => null);
const receiptHeader = res.headers.get('payment-response');
const receipt = receiptHeader ? decodePaymentResponseHeader(receiptHeader) : null;

console.log(JSON.stringify({
  status: res.status,
  ms: Date.now() - t0,
  receipt,
  verdict: body?.verdict,
  score: body?.score,
  error: body?.error,
}, null, 1));
