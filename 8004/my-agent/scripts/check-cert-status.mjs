// Consulta (solo lectura) del estado de certificacion de publisher en 8004scan.
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';

const raw = JSON.parse(readFileSync(new URL('../.owner-wallet.json', import.meta.url), 'utf8'));
const pk = raw.privateKey || raw.private_key || raw.key;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
const API = 'https://api.8004scan.io/api/v1';

const nonce = await fetch(`${API}/auth/nonce`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address }),
}).then((r) => r.json());
const sig = await account.signMessage({ message: String(nonce.message || nonce.nonce) });
const login = await fetch(`${API}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address, signature: sig, nonce: nonce.nonce }),
}).then((r) => r.json());
const token = login.access_token || login.token || login.data?.access_token;
if (!token) {
  console.error('Login fallo:', JSON.stringify(login).slice(0, 300));
  process.exit(1);
}

const status = await fetch(`${API}/users/me/certifications/publisher`, {
  headers: { 'X-Access-Token': token },
});
console.log('HTTP', status.status);
console.log(JSON.stringify(await status.json().catch(() => null), null, 2).slice(0, 1200));
