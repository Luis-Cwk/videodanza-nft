// Registra el webhook de 8004scan para entropiav2.
// Flujo: nonce -> personal_sign -> login (JWT) -> POST /webhooks/register
// El servidor devuelve el secret de firma; se guarda en .env y en Vercel.
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const API = 'https://api.8004scan.io/api/v1';
const pk = process.env.PRIVATE_KEY;
const account = privateKeyToAccount(pk.startsWith('0x') ? pk : `0x${pk}`);
console.log('Owner wallet:', account.address);

// 1. nonce
const nonceRes = await fetch(`${API}/auth/nonce`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address }),
});
const nonceJson = await nonceRes.json();
const nonce = nonceJson.nonce || nonceJson.data?.nonce || nonceJson.message;
if (!nonce) { console.error('Sin nonce:', JSON.stringify(nonceJson).slice(0, 200)); process.exit(1); }

// 2. firma
const message = nonceJson.message || nonce;
const signature = await account.signMessage({ message: String(message) });

// 3. login
const loginRes = await fetch(`${API}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ wallet_address: account.address, signature, nonce }),
});
const loginJson = await loginRes.json();
const token = loginJson.access_token || loginJson.token || loginJson.data?.access_token;
if (!token) { console.error('Sin token:', JSON.stringify(loginJson).slice(0, 300)); process.exit(1); }
console.log('JWT OK');

// 4. registrar webhook
const reg = await fetch(`${API}/webhooks/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Access-Token': token },
  body: JSON.stringify({
    webhook_url: 'https://my-agent-tau.vercel.app/webhook',
    events: ['feedback.received', 'feedback.revoked', 'star.received', 'star.removed', 'validation.requested', 'validation.completed'],
  }),
});
console.log('register status:', reg.status);
const regJson = await reg.json();
console.log('respuesta (sin secret):', JSON.stringify({ ...regJson, secret: regJson.secret ? regJson.secret.slice(0, 8) + '...' : regJson.data?.secret ? regJson.data.secret.slice(0, 8) + '...' : undefined }).slice(0, 500));

const secret = regJson.secret || regJson.data?.secret;
const webhookId = regJson.id || regJson.webhook_id || regJson.data?.id;
if (!secret) { console.log('SIN SECRET en respuesta; abortando actualizacion'); process.exit(1); }

// 5. guardar secret en .env local
const envPath = 'C:/Users/petra/videodanza-nft/8004/my-agent/.env';
let env = readFileSync(envPath, 'utf8');
if (/WEBHOOK_SECRET_8004=/.test(env)) {
  env = env.replace(/WEBHOOK_SECRET_8004=\S+/, 'WEBHOOK_SECRET_8004=' + secret);
} else {
  env += '\nWEBHOOK_SECRET_8004=' + secret + '\n';
}
writeFileSync(envPath, env, { mode: 0o600 });
console.log('secret guardado en .env local');

// 6. actualizar Vercel env
const r = spawnSync('npx', ['-y', 'vercel', 'env', 'add', 'WEBHOOK_SECRET_8004', 'production', '--force'], {
  cwd: 'C:/Users/petra/videodanza-nft/8004/my-agent', input: secret + '\n', encoding: 'utf8', shell: true, timeout: 90000,
});
const out = (r.stdout || '') + (r.stderr || '');
console.log('vercel env:', out.split('\n').filter(l => l.trim()).slice(-2).join(' | ').slice(0, 150));
console.log('webhook id:', webhookId);
console.log('secret (primeros 8):', secret.slice(0, 8) + '...');
