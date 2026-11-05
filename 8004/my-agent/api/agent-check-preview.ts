/**
 * Vercel Serverless Function - Agent Check Preview (GRATIS)
 * GET /api/agent-check-preview -> GET /v1/agent-check/preview
 *
 * Anzuelo del endpoint pagado: mismo veredicto y mismas banderas, pero sin el
 * score exacto, sin desglose de servicios, metadata, reputacion ni wallet.
 * Sirve para que un agente compruebe que el dato es real antes de pagar.
 *
 * Limite por IP best-effort en memoria del proceso: en serverless cada instancia
 * tiene su propio contador y se reinicia en frio. No es una barrera de seguridad,
 * es para que un bucle no nos queme la cuota de 8004scan.
 */
import { scoreAgent } from '../src/agent-check.js';

const SCAN_API = 'https://api.8004scan.io/api/v1/agents';
const LIMITE_DIA = 20;

const contador = new Map<string, { dia: string; n: number }>();

function ipDe(req: any): string {
  const f = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(f) ? f[0] : String(f || '');
  return raw.split(',')[0].trim() || 'desconocida';
}

function permitido(ip: string): { ok: boolean; usados: number } {
  const dia = new Date().toISOString().slice(0, 10);
  const actual = contador.get(ip);
  if (!actual || actual.dia !== dia) {
    contador.set(ip, { dia, n: 1 });
    return { ok: true, usados: 1 };
  }
  if (actual.n >= LIMITE_DIA) return { ok: false, usados: actual.n };
  actual.n += 1;
  return { ok: true, usados: actual.n };
}

function banda(score: number): string {
  if (score >= 80) return '80-100';
  if (score >= 60) return '60-79';
  return '0-59';
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed, usa GET' });

  const ip = ipDe(req);
  const cupo = permitido(ip);
  if (!cupo.ok) {
    return res.status(429).json({
      error: `Limite gratuito alcanzado (${LIMITE_DIA}/dia por IP)`,
      full_report: 'GET /v1/agent-check ($0.02 USDC en Base, sin cuenta)',
    });
  }
  res.setHeader('X-Preview-Remaining', String(Math.max(0, LIMITE_DIA - cupo.usados)));

  const query: Record<string, string> =
    req.query || Object.fromEntries(new URL(req.url || '/', 'https://agent.local').searchParams);

  const chain = String(query.chain || '8453');
  const agentId = String(query.agent_id || query.token_id || '');

  if (!/^\d+$/.test(chain) || !/^\d+$/.test(agentId)) {
    return res.status(400).json({
      error: 'Parametros invalidos: chain y agent_id deben ser numericos',
      example: '/v1/agent-check/preview?chain=8453&agent_id=356966',
    });
  }

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (process.env.SCAN8004_API_KEY) headers['X-API-Key'] = process.env.SCAN8004_API_KEY;

  let upstream: Response;
  try {
    upstream = await fetch(`${SCAN_API}/${chain}/${agentId}`, {
      headers,
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return res.status(504).json({ error: '8004scan no respondio a tiempo' });
  }

  if (upstream.status === 404) {
    return res.status(404).json({ error: `Agente ${chain}:${agentId} no encontrado en 8004scan` });
  }
  if (!upstream.ok) {
    return res.status(502).json({ error: `8004scan respondio ${upstream.status}` });
  }

  const report = scoreAgent(await upstream.json(), Number(chain), agentId);

  res.status(200).json({
    ok: true,
    preview: true,
    agent: {
      chain_id: report.agent.chain_id,
      token_id: report.agent.token_id,
      name: report.agent.name,
      active: report.agent.active,
    },
    verdict: report.verdict,
    score_band: banda(report.score),
    flags: report.flags.map((f) => f.code),
    full_report: `GET /v1/agent-check?chain=${chain}&agent_id=${agentId} ($0.02 USDC en Base, sin cuenta)`,
    withheld: ['score exacto', 'detalle de servicios', 'metadata', 'reputacion', 'wallet', 'mensaje de cada bandera'],
    note: 'Vista gratuita y best-effort: limite por IP en memoria, se reinicia en frio.',
    checked_at: report.checked_at,
  });
}
