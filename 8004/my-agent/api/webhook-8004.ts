/**
 * Vercel Serverless Function - 8004scan Webhook Receiver
 * POST /api/webhook-8004 -> POST /webhook
 *
 * Recibe los eventos del webhook de 8004scan (feedback.received,
 * star.received, validation.*, etc.), verifica la firma HMAC-SHA256 del
 * header X-Webhook-Signature y reenvia un correo a Petra via Brevo.
 *
 * Env vars requeridas (Vercel + .env local):
 *   WEBHOOK_SECRET_8004  secreto compartido con 8004scan (min 16 chars)
 *   BREVO_API_KEY        API key de Brevo (cuenta de petrasynthetic.com)
 *   NOTIFY_EMAIL         opcional, default dfrmnc22@gmail.com
 */
import { createHmac, timingSafeEqual } from 'crypto';

const SECRET = process.env.WEBHOOK_SECRET_8004 || '';
const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'dfrmnc22@gmail.com';

function verify(raw: string, sig: string): boolean {
  if (!SECRET || !sig || !raw) return false;
  const expected = createHmac('sha256', SECRET).update(raw, 'utf-8').digest('hex');
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

/** @vercel/node puede haber consumido el stream; si no, esto lo lee crudo. */
async function readRaw(req: any): Promise<string> {
  try {
    const chunks: any[] = [];
    for await (const c of req) chunks.push(c);
    return Buffer.concat(chunks).toString('utf-8');
  } catch {
    return '';
  }
}

async function sendEmail(subject: string, html: string): Promise<void> {
  if (!BREVO_API_KEY) {
    console.warn('[webhook] BREVO_API_KEY ausente, no se manda correo');
    return;
  }
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': BREVO_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'entropiav2 webhooks', email: 'hola@petrasynthetic.com' },
      to: [{ email: NOTIFY_EMAIL }],
      subject,
      htmlContent: html,
    }),
  });
  if (!r.ok) {
    console.error('[webhook] Brevo fallo:', r.status, (await r.text()).slice(0, 200));
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const raw = await readRaw(req);
  const sig = String(req.headers['x-webhook-signature'] || '');
  const parsedStr = req.body ? JSON.stringify(req.body) : '';

  // Candidatos: cuerpo crudo (si el runtime lo dejo) y el re-serializado.
  const ok = [raw, parsedStr].filter(Boolean).some((c) => verify(c, sig));

  if (!ok) {
    console.warn(
      '[webhook] firma invalida. rawLen=' + raw.length,
      'parsedLen=' + parsedStr.length,
      'sig=' + sig.slice(0, 16),
    );
    return res.status(401).json({ error: 'Invalid signature' });
  }

  let event: any = req.body;
  if (!event && raw) {
    try {
      event = JSON.parse(raw);
    } catch {
      event = {};
    }
  }
  event = event || {};
  const ev = event.event || String(req.headers['x-webhook-event'] || 'unknown');
  const d = event.data || {};

  console.log('[webhook]', ev, JSON.stringify(d).slice(0, 400));

  const rows = [
    `<b>Evento:</b> ${ev}`,
    `<b>Agente:</b> ${d.agentId ?? '-'}`,
    d.submitter ? `<b>De:</b> ${d.submitter}` : '',
    d.value !== undefined ? `<b>Valor:</b> ${d.value} (dec ${d.decimals ?? 0})` : '',
    d.tag ? `<b>Tag:</b> ${d.tag}` : '',
    d.validator ? `<b>Validator:</b> ${d.validator}` : '',
    d.score !== undefined ? `<b>Score:</b> ${d.score}` : '',
    d.transactionHash
      ? `<b>Tx:</b> <a href="https://sepolia.etherscan.io/tx/${d.transactionHash}">${String(d.transactionHash).slice(0, 18)}...</a>`
      : '',
    `<b>Hora:</b> ${event.timestamp || new Date().toISOString()}`,
    `<a href="https://testnet.8004scan.io/agents/sepolia/2387">Ver entropiav2 en 8004scan</a>`,
  ]
    .filter(Boolean)
    .join('<br>');

  try {
    await sendEmail(`[entropiav2] ${ev}`, `<p>${rows}</p>`);
  } catch (e: any) {
    console.error('[webhook] error mandando correo:', e?.message);
  }

  return res.status(200).json({ received: true });
}
