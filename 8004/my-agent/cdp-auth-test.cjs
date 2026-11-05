// Inspecciona la key de CDP, la normaliza a .cdp-keys.json y prueba auth contra el facilitador.
const fs = require('fs');
const { createPrivateKey, sign, randomBytes } = require('crypto');

const SRC = 'cdp_api_key.json';
const DST = '.cdp-keys.json';
const j = JSON.parse(fs.readFileSync(SRC, 'utf8'));
console.log('campos:', Object.keys(j).join(', '));
console.log('id:', typeof j.id === 'string' ? j.id.slice(0, 8) + '...' : 'NO');
const key = createPrivateKey(j.privateKey);
const alg = key.asymmetricKeyType === 'ed25519' ? 'EdDSA' : 'ES256';
console.log('tipo de llave:', key.asymmetricKeyType, '| alg JWT:', alg);

fs.writeFileSync(DST, JSON.stringify(j, null, 2), { mode: 0o600 });
fs.unlinkSync(SRC);
console.log('guardada como', DST, '| original eliminado');

function b64(x) {
  return Buffer.from(x).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function jwt(method, uri) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: alg, kid: j.id, nonce: randomBytes(16).toString('hex') };
  const payload = { sub: j.id, iss: 'cdp', aud: ['cdp_service'], nbf: now, exp: now + 120, uri: method + ' ' + uri };
  const input = b64(JSON.stringify(header)) + '.' + b64(JSON.stringify(payload));
  const sig = alg === 'EdDSA' ? sign(null, Buffer.from(input), key) : sign('sha256', Buffer.from(input), { key: key, dsaEncoding: 'ieee-p1363' });
  return input + '.' + b64(sig);
}

(async () => {
  const base = 'https://api.cdp.coinbase.com/platform/v2/x402';
  const pruebas = [
    ['GET', base + '/supported', 'api.cdp.coinbase.com/platform/v2/x402/supported'],
    ['GET', base + '/supported', 'platform/v2/x402/supported'],
    ['POST', base + '/verify', 'api.cdp.coinbase.com/platform/v2/x402/verify'],
  ];
  for (const p of pruebas) {
    const method = p[0];
    const url = p[1];
    const uri = p[2];
    try {
      const opts = { method: method, headers: { Authorization: 'Bearer ' + jwt(method, uri), 'Content-Type': 'application/json' } };
      if (method === 'POST') opts.body = JSON.stringify({ paymentPayload: { x402Version: 1 }, paymentRequirements: {} });
      const r = await fetch(url, opts);
      console.log(method, uri.replace('api.cdp.coinbase.com', ''), '->', r.status, (await r.text()).slice(0, 120));
    } catch (e) {
      console.log(method, uri, '-> ERR', e.message.slice(0, 80));
    }
  }
})().catch((e) => { console.error('ERR', e.message.slice(0, 150)); process.exit(1); });
