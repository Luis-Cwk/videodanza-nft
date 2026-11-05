/**
 * Vercel Serverless Function - Agent Check (x402 v2, descubrible en el Bazaar de CDP)
 * GET /v1/agent-check -> GET /api/agent-check
 *
 * Due diligence de un agente ERC-8004 antes de llamarlo o pagarle.
 * Precio: 0.02 USDC en Base mainnet. Sin cuenta ni API key.
 *
 * Por que v2: el Bazaar de CDP solo indexa rutas que declaran metadatos de
 * descubrimiento (extensions.bazaar). Aqui se declaran a mano con
 * declareDiscoveryExtension y se registra la extension en el resource server.
 *
 * Mismo cuidado que en premium-composition: el handler corre DENTRO del
 * callback de next(), porque el middleware espera res.end() para liquidar.
 */
import { paymentMiddlewareFromHTTPServer } from '@x402/express';
import { HTTPFacilitatorClient, x402HTTPResourceServer, x402ResourceServer } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { bazaarResourceServerExtension, declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { cdpAuthHeader } from '../src/cdp-auth.js';
import { scoreAgent } from '../src/agent-check.js';

const PAY_TO = (process.env.X402_PAY_TO || '0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f') as `0x${string}`;
const PRICE = process.env.AGENT_CHECK_PRICE || '$0.02';
const NETWORK = 'eip155:8453';
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const SCAN_API = 'https://api.8004scan.io/api/v1/agents';
const ROUTE = 'GET /v1/agent-check';

const DESCRIPTION =
  'Due diligence on an ERC-8004 agent before you pay it or call it: live services and their health, metadata completeness, onchain feedback count and score, wallet activity, concrete red flags, and a usable/caution/avoid verdict with a 0-100 score. Call it when you must decide whether another agent is safe to transact with. Params: chain (default 8453) and agent_id (ERC-8004 token id).';

const EXAMPLE_OUTPUT = {
  ok: true,
  agent: { chain_id: 8453, token_id: '356966', name: 'entropiav2', active: true },
  services: { healthy: 2, total: 4 },
  reputation: { feedbacks: 7, average_score: 99, evidence_tier: 'established' },
  flags: [{ code: 'wallet_unproven', severity: 'warning' }],
  verdict: 'caution',
  score: 85,
};

let middlewarePromise: Promise<ReturnType<typeof paymentMiddlewareFromHTTPServer>> | null = null;

function getMiddleware() {
  if (!middlewarePromise) {
    middlewarePromise = (async () => {
      const facilitator = new HTTPFacilitatorClient({
        url: FACILITATOR_URL,
        createAuthHeaders: async () => ({
          verify: cdpAuthHeader('POST', '/platform/v2/x402/verify'),
          settle: cdpAuthHeader('POST', '/platform/v2/x402/settle'),
          supported: cdpAuthHeader('GET', '/platform/v2/x402/supported'),
          bazaar: cdpAuthHeader('GET', '/platform/v2/x402/discovery/resources'),
        }),
      });

      const resourceServer = new x402ResourceServer(facilitator);
      registerExactEvmScheme(resourceServer, { networks: [NETWORK] });
      resourceServer.registerExtension(bazaarResourceServerExtension);

      const httpServer = new x402HTTPResourceServer(resourceServer, {
        [ROUTE]: {
          accepts: { scheme: 'exact', price: PRICE, network: NETWORK, payTo: PAY_TO },
          description: DESCRIPTION,
          serviceName: 'entropiav2',
          tags: ['agent-check', 'due-diligence', 'erc8004', 'reputation'],
          iconUrl: 'https://entropia.petrasynthetic.com/avatar.png',
          extensions: declareDiscoveryExtension({
            input: { chain: '8453', agent_id: '356966' },
            inputSchema: {
              type: 'object',
              properties: {
                chain: { type: 'string', description: 'EVM chain id del agente (default 8453, Base).' },
                agent_id: { type: 'string', description: 'Token id del agente en el Identity Registry de ERC-8004.' },
              },
              required: ['agent_id'],
            },
            output: { example: EXAMPLE_OUTPUT },
          }),
        },
      });

      return paymentMiddlewareFromHTTPServer(httpServer as any);
    })().catch((error) => {
      middlewarePromise = null;
      throw error;
    });
  }
  return middlewarePromise;
}

export default async function handler(req: any, res: any) {
  // Vercel serverless no expone los helpers de Express que el middleware usa.
  if (!req.path) {
    const rawUrl = req.url || '/v1/agent-check';
    req.path = rawUrl.split('?')[0];
    if (req.path === '/api/agent-check') req.path = '/v1/agent-check';
  }
  if (!req.originalUrl) req.originalUrl = req.url || req.path;
  if (!req.protocol) req.protocol = 'https';
  if (typeof req.header !== 'function') {
    req.header = (name: string) => {
      const v = req.headers?.[String(name).toLowerCase()];
      return Array.isArray(v) ? v[0] : v;
    };
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, PAYMENT-SIGNATURE, X-PAYMENT');
  res.setHeader('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE, EXTENSION-RESPONSES');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed, usa GET' });

  let middleware: Awaited<ReturnType<typeof getMiddleware>>;
  try {
    middleware = await getMiddleware();
  } catch (error: any) {
    console.error('[agent-check] middleware no disponible:', error?.message || error);
    return res.status(500).json({ error: 'Payment middleware unavailable' });
  }

  await middleware(req, res, () => {
    serveCheck(req, res).catch((error: any) => {
      console.error('[agent-check] error:', error?.message || error);
      if (!res.writableEnded) res.status(500).json({ error: 'Internal error' });
    });
  });
}

async function serveCheck(req: any, res: any) {
  const query: Record<string, string> =
    req.query || Object.fromEntries(new URL(req.url || '/', 'https://agent.local').searchParams);

  const chain = String(query.chain || '8453');
  const agentId = String(query.agent_id || query.token_id || '');

  if (!/^\d+$/.test(chain) || !/^\d+$/.test(agentId)) {
    return res.status(400).json({
      error: 'Parametros invalidos: chain y agent_id deben ser numericos',
      example: '/v1/agent-check?chain=8453&agent_id=356966',
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

  const raw = await upstream.json();
  const report = scoreAgent(raw, Number(chain), agentId);
  res.status(200).json({ ok: true, ...report });
}
