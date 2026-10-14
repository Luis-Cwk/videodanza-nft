// Fix 3: Configurar perfil de publisher en 8004scan.
// Login owner -> subir avatar -> actualizar perfil (username, bio, avatar, social).
// No persiste el token: todo en memoria en una sola corrida.
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { privateKeyToAccount } from 'viem/accounts';

const API = 'https://api.8004scan.io/api/v1';

const pk = process.env.PRIVATE_KEY;
if (!pk) { console.error('Falta PRIVATE_KEY'); process.exit(1); }
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
const wallet = account.address;
console.log('Owner:', wallet);

// 1. Login
const nonceRes = await fetch(`${API}/auth/nonce`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: wallet }),
});
const nonceJson = await nonceRes.json();
const signature = await account.signMessage({ message: String(nonceJson.message || nonceJson.nonce) });
const loginRes = await fetch(`${API}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: wallet, signature, nonce: nonceJson.nonce }),
});
const loginJson = await loginRes.json();
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
if (!token) { console.error('Login fallo:', JSON.stringify(loginJson).slice(0, 300)); process.exit(1); }
console.log('Login OK');

// 2. Perfil actual
const me = await fetch(`${API}/auth/me`, { headers: { 'X-Access-Token': token } }).then(r => r.json());
console.log('Perfil actual:', JSON.stringify({ username: me.username, bio: me.bio, avatar_url: me.avatar_url, website_url: me.website_url, twitter_handle: me.twitter_handle }).slice(0, 400));

// 3. Subir avatar
const avatarPath = process.env.AVATAR_PATH;
if (!avatarPath) { console.error('Falta AVATAR_PATH'); process.exit(1); }
const buf = readFileSync(avatarPath);
const form = new FormData();
form.append('file', new Blob([buf], { type: 'image/jpeg' }), 'petra.jpg');
const upRes = await fetch(`${API}/storage/upload`, {
  method: 'POST', headers: { 'X-Access-Token': token }, body: form,
});
const upJson = await upRes.json();
console.log('Upload:', upRes.status, JSON.stringify(upJson).slice(0, 300));
const avatarUrl = upJson.url || upJson.data?.url;
if (!avatarUrl) { console.error('Sin URL de avatar'); process.exit(1); }

// 4. Actualizar perfil
const payload = {
  username: process.env.SET_USERNAME || 'petra',
  bio: process.env.SET_BIO || 'Artista multidisciplinario. Cuerpo + tecnologia + datos. CDMX. Opero entropiav2 (ERC-8004, x402).',
  avatar_url: avatarUrl,
  twitter_handle: process.env.SET_TWITTER || 'kinetic4i',
  website_url: process.env.SET_WEBSITE || 'https://petrasynthetic.com',
};
console.log('Actualizando con:', JSON.stringify(payload));
const putRes = await fetch(`${API}/auth/me`, {
  method: 'PUT',
  headers: { 'X-Access-Token': token, 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});
const putJson = await putRes.json().catch(() => ({}));
console.log('PUT status:', putRes.status, JSON.stringify(putJson).slice(0, 400));

// 5. Verificar
const me2 = await fetch(`${API}/auth/me`, { headers: { 'X-Access-Token': token } }).then(r => r.json());
console.log('=== PERFIL NUEVO ===');
console.log(JSON.stringify({ username: me2.username, bio: me2.bio, avatar_url: me2.avatar_url, website_url: me2.website_url, twitter_handle: me2.twitter_handle }, null, 2));
