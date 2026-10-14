// Solicita un health check manual del agente como owner via API de 8004scan.
// Flujo: nonce -> firma personal_sign -> login -> POST health-check
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';

const API = 'https://api.8004scan.io/api/v1';
const pk = process.env.PRIVATE_KEY;
if (!pk) { console.error('Falta PRIVATE_KEY'); process.exit(1); }
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
const wallet = account.address;
console.log('Owner wallet:', wallet);

// 1. Pedir nonce
const nonceRes = await fetch(`${API}/auth/nonce`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: wallet }),
});
const nonceJson = await nonceRes.json();
console.log('Nonce response:', JSON.stringify(nonceJson).slice(0, 300));

const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message;
if (!nonce) { console.error('No se obtuvo nonce'); process.exit(1); }

// 2. Firmar. Probar personal_sign del mensaje (o del nonce tal cual).
const message = nonceJson.message || nonce;
const signature = await account.signMessage({ message: String(message) });
console.log('Firma generada:', signature.slice(0, 30) + '...');

// 3. Login
const loginRes = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: wallet, signature, nonce }),
});
const loginJson = await loginRes.json();
console.log('Login status:', loginRes.status);
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
if (!token) { console.log('Login response:', JSON.stringify(loginJson).slice(0, 400)); process.exit(1); }
console.log('Token obtenido OK');

// 4. Solicitar health check
const hcRes = await fetch(`${API}/agents/11155111/2387/health-check`, {
  method: 'POST',
  headers: { 'X-Access-Token': token },
});
console.log('Health check status:', hcRes.status, await hcRes.text());

// Bonus: metadata refresh
const mrRes = await fetch(`${API}/agents/11155111/2387/metadata-refresh`, {
  method: 'POST',
  headers: { 'X-Access-Token': token },
});
console.log('Metadata refresh status:', mrRes.status, await mrRes.text());
