import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';

const API = 'https://api.8004scan.io/api/v1';
const OLD = '0f3fe0b3-267c-4dbe-8395-64bdfbf70b6f';
const pk = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
const nonceJson = await (await fetch(`${API}/auth/nonce`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address }),
})).json();
const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message;
const signature = await account.signMessage({ message: String(nonceJson.message || nonce) });
const loginJson = await (await fetch(`${API}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address, signature, nonce }),
})).json();
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
const auth = { 'X-Access-Token': token, 'Content-Type': 'application/json' };

for (let i = 1; i <= 3; i++) {
  const del = await fetch(`${API}/webhooks/${OLD}`, { method: 'DELETE', headers: auth });
  const txt = (await del.text()).slice(0, 120);
  console.log(`intento ${i}:`, del.status, txt);
  if (del.ok) break;
}

const after = await (await fetch(`${API}/webhooks`, { headers: auth })).json();
console.log('despues:', JSON.stringify(after));
