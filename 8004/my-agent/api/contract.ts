/**
 * Vercel Serverless Function - Contrato del servicio
 * GET /api/contract -> GET /v1/contract
 *
 * Lo que un agente necesita leer antes de integrar: version, rutas, precio,
 * red, esquemas y changelog. Solo hechos verificables; lo que no se mide se
 * declara como no medido en vez de inventarse.
 */

const VERSION = '1.0.0';
const ACTUALIZADO = '2026-11-04';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed, usa GET' });

  res.status(200).json({
    service: 'entropiav2',
    version: VERSION,
    api_version: 'v1',
    updated_at: ACTUALIZADO,
    routes: [
      {
        method: 'GET',
        path: '/v1/agent-check/preview',
        price: 'gratis',
        network: null,
        params: { chain: 'string (default 8453)', agent_id: 'string (ERC-8004 token id)' },
        returns: ['verdict', 'score_band', 'flags (codigos)', 'agent'],
        limits: '20 por IP y dia, best-effort en memoria',
      },
      {
        method: 'GET',
        path: '/v1/agent-check',
        price: '$0.02 USDC',
        network: 'eip155:8453 (Base)',
        payment: 'x402 v2, scheme exact, facilitador de CDP',
        params: { chain: 'string (default 8453)', agent_id: 'string (ERC-8004 token id)' },
        returns: ['agent', 'services', 'metadata', 'reputation', 'wallet', 'flags', 'verdict', 'score', 'sources'],
      },
      {
        method: 'GET',
        path: '/v1/premium-composition',
        price: '$0.10 USDC',
        network: 'eip155:8453 (Base)',
        payment: 'x402 v2, scheme exact, facilitador de CDP',
        params: { seed: 'string', mood: 'string', gender: 'string', energy: 'string', perspective: 'string', token_id: 'integer' },
        returns: ['composition', 'poetic_description', 'curatorial_text', 'token_id', 'deterministic'],
      },
      {
        method: 'POST',
        path: '/v1/prompt/analyze',
        price: '$0.02 USDC',
        network: 'eip155:8453 (Base)',
        payment: 'x402 v2, scheme exact, facilitador de CDP',
        params: { image_url: 'string (URL HTTPS publica, jpg/png/webp, maximo 8 MB)' },
        returns: ['analysis (framing, gesture, light, palette, medium, camera)', 'prompt', 'negative', 'fields_completed'],
      },
      {
        method: 'GET',
        path: '/mcp',
        price: 'gratis',
        network: null,
        returns: ['JSON-RPC 2.0: initialize, tools/list, tools/call'],
      },
      {
        method: 'POST',
        path: '/a2a',
        price: 'gratis',
        network: null,
        returns: ['JSON-RPC 2.0 A2A'],
      },
      {
        method: 'GET',
        path: '/health',
        price: 'gratis',
        network: null,
        returns: ['estado del agente'],
      },
    ],
    discovery: {
      agent_card: '/.well-known/agent-card.json',
      registration: '/.well-known/agent-registration.json',
      mcp: '/mcp',
      a2a: '/a2a',
      bazaar: 'x402 v2 discovery extension declarada en /v1/agent-check',
      contract: '/v1/contract',
    },
    versions: {
      policy: 'cambio incompatible sube api_version; cambio compatible sube version',
      deprecated: [],
    },
    uptime: {
      measured: false,
      note: 'No hay monitor externo todavia. No se publica un numero que no se mide.',
    },
    changelog: [
      { date: '2026-11-06', change: 'Nueva ruta POST /v1/prompt/analyze: prompt que describe una imagen, 0.02 USDC.' },
      { date: '2026-11-04', change: 'premium-composition migra a x402 v2 en Base mainnet, con facilitador de CDP y extension del Bazaar.' },
      { date: '2026-11-04', change: 'agent_check y agent_check_preview se exponen por MCP; el pago por MCP ahora delega en la ruta HTTP.' },
      { date: '2026-11-04', change: 'Se agrega /v1/agent-check/preview (gratis) y /v1/contract.' },
      { date: '2026-11-04', change: 'Primera llamada pagada a /v1/agent-check liquidada en Base.' },
      { date: '2026-10-23', change: 'Primera venta de /v1/premium-composition en Base mainnet.' },
    ],
    note: 'Este documento es la fuente de verdad de rutas y precios. Si no esta aqui, no existe.',
  });
}
