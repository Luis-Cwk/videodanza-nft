/**
 * JWT de CDP para el facilitador de Coinbase (ES256 o Ed25519 segun la key).
 * shortcut: duplicado de api/premium-composition.ts, unificar cuando esa ruta
 * migre a x402 v2.
 */
import { createPrivateKey, sign as cryptoSign, randomBytes } from 'crypto';

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function cdpAuthHeader(method: string, path: string): Record<string, string> {
  const keyId = process.env.CDP_API_KEY_ID || '';
  const keySecret = process.env.CDP_API_KEY_SECRET || '';
  if (!keyId || !keySecret) return {};
  let keyObj;
  let alg: 'ES256' | 'EdDSA';
  try {
    keyObj = createPrivateKey(keySecret);
    alg = keyObj.asymmetricKeyType === 'ed25519' ? 'EdDSA' : 'ES256';
  } catch {
    return {};
  }
  const now = Math.floor(Date.now() / 1000);
  const header = { alg, kid: keyId, nonce: randomBytes(16).toString('hex') };
  const payload = {
    sub: keyId,
    iss: 'cdp',
    aud: ['cdp_service'],
    nbf: now,
    exp: now + 120,
    uri: `${method} api.cdp.coinbase.com${path}`,
  };
  const signingInput = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(payload))}`;
  const signature = alg === 'EdDSA'
    ? cryptoSign(null, Buffer.from(signingInput), keyObj)
    : cryptoSign('sha256', Buffer.from(signingInput), { key: keyObj, dsaEncoding: 'ieee-p1363' });
  return { Authorization: `Bearer ${signingInput}.${base64url(signature)}` };
}
