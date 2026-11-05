// Compra de prueba del endpoint /v1/agent-check con la wallet compradora.
// Uso: node scripts/pay-agent-check.mjs [chain] [agent_id]
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';
import { wrapFetchWithPayment, decodePaymentResponseHeader } from '@x402/fetch';
import { x402Client } from '@x402/core/client';
import { registerExactEvmScheme } from '@x402/evm/exact/client';

const chain = process.argv[2] || '8453';
const agentId = process.argv[3] || '356966';
const walletFile = process.argv[4] || '.buyer-mainnet.json';
const raw = JSON.parse(readFileSync(new URL(`../${walletFile}`, import.meta.url), 'utf8'));
const pk = raw.privateKey || raw.private_key || raw.key || raw.pk;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer: account });
const fetchWithPayment = wrapFetchWithPayment(fetch, client);

const url = `https://entropia.petrasynthetic.com/v1/agent-check?chain=${chain}&agent_id=${agentId}`;
const t0 = Date.now();
const res = await fetchWithPayment(url);
const body = await res.json().catch(() => null);
const receiptHeader = res.headers.get('payment-response');
const receipt = receiptHeader ? decodePaymentResponseHeader(receiptHeader) : null;
const ext = res.headers.get('extension-responses');

console.log(JSON.stringify({
  status: res.status,
  ms: Date.now() - t0,
  receipt,
  extensions: ext ? JSON.parse(Buffer.from(ext, 'base64').toString('utf8')) : null,
  verdict: body?.verdict,
  score: body?.score,
  flags: body?.flags?.map((f) => f.code),
}, null, 1));
