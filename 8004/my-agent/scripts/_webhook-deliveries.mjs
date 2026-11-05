// Consulta las entregas del webhook de 8004scan (JWT de sesion del owner).
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';

const API = 'https://api.8004scan.io/api/v1';
const pk = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);

const nonceRes = await fetch(`${API}/auth/nonce`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address }),
});
const nonceJson = await nonceRes.json();
const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message;
if (!nonce) { console.error('Sin nonce:', JSON.stringify(nonceJson).slice(0, 200)); process.exit(1); }
const signature = await account.signMessage({ message: String(nonceJson.message || nonce) });
const loginJson = await (await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address, signature, nonce }),
})).json();
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
if (!token) { console.error('Sin token:', JSON.stringify(loginJson).slice(0, 300)); process.exit(1); }

const auth = { 'X-Access-Token': token };
const hooks = await (await fetch(`${API}/webhooks`, { headers: auth })).json();
console.log('webhooks:', JSON.stringify(hooks).slice(0, 900));

const list = hooks.webhooks || hooks.data || (Array.isArray(hooks) ? hooks : []);
for (const w of list) {
  const id = w.id || w.webhook_id;
  const del = await (await fetch(`${API}/webhooks/${id}/deliveries`, { headers: auth })).json();
  console.log(`--- ${id} ${w.webhook_url || w.url || ''} status=${w.status || w.is_active}`);
  console.log(JSON.stringify(del).slice(0, 1500));
}
