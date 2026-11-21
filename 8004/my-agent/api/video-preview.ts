/**
 * Vercel Serverless Function - Video Sequence Preview (GRATIS)
 * GET  /api/video-preview?brief=...&aspect=16:9
 * POST /api/video-preview { brief, aspect }
 * Rewrite: /v1/video/preview
 *
 * Puerta de entrada de la secuencia pagada. No genera video ni gasta modelo:
 * devuelve la secuencia de tres clips ya armada (CANON identico, frame de
 * empalme, negativo y ajustes) para que el cliente vea exactamente que va a
 * recibir antes de pagar.
 *
 * Aqui vive tambien el filtro que evita cobrar por algo que el modelo va a
 * rechazar. Si el brief no pasa, se dice antes del pago, no despues.
 */
import { construirSecuencia, PRODUCTO, revisarBrief, type Aspecto } from '../src/video-prompts.js';
import { ipDe, limite, permitido } from '../src/limite.js';
import { logHit } from '../src/call-log.js';

const LIMITE_DIA = limite('LIMITE_VIDEO_PREVIEW_DIA', 30);
const MAX_BRIEF = 1200;
const MIN_BRIEF = 10;

function aspectoDe(v: unknown): Aspecto {
  const s = String(v ?? '').replace(/:/g, 'x');
  if (s === '9x16' || s === '9:16') return '9:16';
  return '16:9';
}

function paramsDe(req: any): Record<string, string> {
  const deUrl = Object.fromEntries(new URL(req.url || '/', 'https://agent.local').searchParams);
  const deQuery = req.query && typeof req.query === 'object' ? req.query : {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(deQuery)) {
    if (v != null) out[k] = String(v);
  }
  return { ...out, ...deUrl };
}

function briefDe(req: any): string {
  const body = req.body;
  let crudo = '';
  if (typeof body === 'string') {
    crudo = body;
  } else if (body && typeof body === 'object') {
    crudo = String(body.brief ?? body.prompt ?? '');
  }
  if (!crudo) {
    const params = paramsDe(req);
    crudo = String(params.brief ?? params.prompt ?? '');
  }
  return crudo.trim();
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed: usa GET o POST' });
  }

  const ip = ipDe(req);
  const cupo = permitido(ip, 'video-preview', LIMITE_DIA, 8);
  if (!cupo.ok) {
    await logHit('/v1/video/preview', req, cupo.rafaga ? 'rafaga' : 'limite-dia');
    return res.status(429).json({
      error: cupo.rafaga
        ? 'Demasiadas llamadas seguidas. Espera un minuto.'
        : `Limite gratuito alcanzado (${LIMITE_DIA}/dia por IP)`,
    });
  }
  res.setHeader('X-Preview-Remaining', String(Math.max(0, LIMITE_DIA - cupo.usados)));

  const brief = briefDe(req);
  const params = paramsDe(req);
  const aspect = aspectoDe(
    (req.body && typeof req.body === 'object' ? req.body.aspect : undefined) ?? params.aspect,
  );

  if (!brief) {
    return res.status(400).json({
      error: 'Falta el brief',
      ejemplo: 'GET /v1/video/preview?brief=un%20cuerpo%20que%20aprende%20a%20caer&aspect=16:9',
      que_hace: 'Devuelve la secuencia de tres clips encadenados. No genera video.',
    });
  }
  if (brief.length < MIN_BRIEF) {
    return res.status(400).json({ error: `El brief es muy corto: minimo ${MIN_BRIEF} caracteres` });
  }
  if (brief.length > MAX_BRIEF) {
    return res.status(400).json({ error: `El brief es muy largo: tope ${MAX_BRIEF} caracteres` });
  }

  const revision = revisarBrief(brief);
  await logHit('/v1/video/preview', req, revision.ok ? 'ok' : 'rechazado');

  if (!revision.ok) {
    return res.status(200).json({
      ok: true,
      aceptado: false,
      motivos: revision.motivos,
      brief,
      nota: 'Este filtro es por texto y es el primer paso, no una garantia. Si el brief cambia, se vuelve a revisar.',
      producto: PRODUCTO,
      timestamp: new Date().toISOString(),
    });
  }

  const secuencia = construirSecuencia(brief, aspect);

  return res.status(200).json({
    ok: true,
    aceptado: true,
    preview: true,
    ...secuencia,
    producto: PRODUCTO,
    aviso:
      'Aqui no se genera video. Esta ruta arma y valida la secuencia; el render de los tres clips va por la ruta pagada cuando hay cupo.',
    timestamp: new Date().toISOString(),
  });
}
