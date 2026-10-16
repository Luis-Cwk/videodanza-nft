// Reintenta el metadata-refresh de 8004scan para el #2387 (ya con URI HTTPS).
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';

const API = 'https://api.8004scan.io/api/v1';
const account = privateKeyToAccount(process.env.PRIVATE_KEY);

const nonceJson = await (await fetch(`${API}/auth/nonce`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account.address }) })).json();
const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message;
const signature = await account.signMessage({ message: String(nonceJson.message || nonce) });
const loginJson = await (await fetch(`${API}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ wallet_address: account.address, signature, nonce }) })).json();
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
console.log('login:', token ? 'OK' : 'FALLO');

const mr = await fetch(`${API}/agents/11155111/2387/metadata-refresh`, { method: 'POST', headers: { 'X-Access-Token': token } });
console.log('metadata-refresh:', mr.status, (await mr.text()).slice(0, 300));
