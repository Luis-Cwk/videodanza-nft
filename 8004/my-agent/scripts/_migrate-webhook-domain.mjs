// Migra el webhook de 8004scan de my-agent-tau.vercel.app a entropia.petrasynthetic.com.
// Pasos: login -> registrar nuevo -> borrar el viejo -> guardar secret en .env -> vercel env add
import 'dotenv/config';
import { privateKeyToAccount } from 'viem/accounts';
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const API = 'https://api.8004scan.io/api/v1';
const NEW_URL = 'https://entropia.petrasynthetic.com/webhook';
const EVENTS = ['feedback.received', 'feedback.revoked', 'star.received', 'star.removed', 'validation.requested', 'validation.completed'];
const ENV_PATH = 'C:/Users/petra/videodanza-nft/8004/my-agent/.env';

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
if (!token) { console.error('Sin token'); process.exit(1); }
const auth = { 'X-Access-Token': token, 'Content-Type': 'application/json' };

const before = await (await fetch(`${API}/webhooks`, { headers: auth })).json();
console.log('antes:', JSON.stringify(before));

const reg = await fetch(`${API}/webhooks/register`, {
  method: 'POST', headers: auth, body: JSON.stringify({ webhook_url: NEW_URL, events: EVENTS }),
});
const regJson = await reg.json();
console.log('register:', reg.status, JSON.stringify({ ...regJson, secret: regJson.secret ? '***' : undefined }));
const secret = regJson.secret || regJson.data?.secret;
const newId = regJson.id || regJson.webhook_id || regJson.data?.id;
if (!secret || !newId) { console.error('Sin secret o id, no toco nada'); process.exit(1); }

// guardar en .env
let env = readFileSync(ENV_PATH, 'utf8');
env = /WEBHOOK_SECRET_8004=/.test(env)
  ? env.replace(/WEBHOOK_SECRET_8004=\S+/, 'WEBHOOK_SECRET_8004=' + secret)
  : env + '\nWEBHOOK_SECRET_8004=' + secret + '\n';
writeFileSync(ENV_PATH, env, 'utf8');
console.log('secret en .env, primeros 8:', secret.slice(0, 8));

// Vercel env de produccion
const v = spawnSync('npx', ['-y', 'vercel', 'env', 'add', 'WEBHOOK_SECRET_8004', 'production', '--force'], {
  cwd: 'C:/Users/petra/videodanza-nft/8004/my-agent', input: secret + '\n', encoding: 'utf8', shell: true, timeout: 120000,
});
console.log('vercel env:', ((v.stdout || '') + (v.stderr || '')).split('\n').filter((l) => l.trim()).slice(-2).join(' | ').slice(0, 200));

// borrar el viejo
const list = before.webhooks || before.data || (Array.isArray(before) ? before : []);
for (const w of list) {
  const id = w.id || w.webhook_id;
  if (id === newId) continue;
  const del = await fetch(`${API}/webhooks/${id}`, { method: 'DELETE', headers: auth });
  console.log('delete', id, del.status, (await del.text()).slice(0, 150));
}

console.log('nuevo webhook:', newId);
