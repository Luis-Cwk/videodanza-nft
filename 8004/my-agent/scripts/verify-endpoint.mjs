// Reintenta la verificacion de endpoint de 8004scan para un agente (login owner).
// Uso: node scripts/verify-endpoint.mjs [agentId] [chainId]   (default 2387 / 11155111)
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';

const agentId = process.argv[2] || '2387';
const chainId = process.argv[3] || '11155111';
const API = 'https://api.8004scan.io/api/v1';
const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const nonceJson = await (await fetch(`${API}/auth/nonce`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account.address }) })).json();
const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message;
const signature = await account.signMessage({ message: String(nonceJson.message || nonce) });
const loginJson = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account.address, signature, nonce }) })).json();
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
console.log('login:', token ? 'OK' : 'FALLO');

const vr = await fetch(`${API}/agents/verify-endpoint/${chainId}/${agentId}`, { method: 'POST', headers: { 'X-Access-Token': token } });
console.log(`verify-endpoint ${chainId}:${agentId}:`, vr.status, (await vr.text()).slice(0, 300));
