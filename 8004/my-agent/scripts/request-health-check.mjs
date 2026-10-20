// Solicita health check manual de un agente (owner). Uso: node scripts/request-health-check.mjs [agentId] [chainId]
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

const hc = await fetch(`${API}/agents/${chainId}/${agentId}/health-check`, { method: 'POST', headers: { 'X-Access-Token': token } });
console.log(`health-check ${chainId}:${agentId}:`, hc.status, (await hc.text()).slice(0, 220));

const mr = await fetch(`${API}/agents/${chainId}/${agentId}/metadata-refresh`, { method: 'POST', headers: { 'X-Access-Token': token } });
console.log(`metadata-refresh ${chainId}:${agentId}:`, mr.status, (await mr.text()).slice(0, 160));
