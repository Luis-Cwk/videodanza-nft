/**
 * Vercel Serverless Function - Premium Composition (x402 v2)
 * GET /api/premium-composition -> GET /v1/premium-composition
 *
 * Composicion determinista + descripcion poetica + texto curatorial.
 * Pago por llamada en USDC sobre Base mainnet, sin cuenta ni API key.
 *
 * v2 (2026-11-04): se migro de x402-express v1 a la misma pila que
 * /v1/agent-check, con extension de descubrimiento del Bazaar y facilitador de
 * CDP. Antes la ruta liquidaba por x402.org y no indexaba.
 *
 * OJO (deadlock): el handler debe correr DENTRO del callback de next(), porque
 * el middleware espera res.end() para liquidar. Si se corre despues del await,
 * el middleware espera la respuesta y el handler espera al middleware.
 */
import { paymentMiddlewareFromHTTPServer } from '@x402/express';
import { HTTPFacilitatorClient, x402HTTPResourceServer, x402ResourceServer } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { bazaarResourceServerExtension, declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { generateComposition, generateNFTDescription, generateResponse } from '../src/agent.js';
import { KNOWN_WALLETS, notifySale } from '../src/notify.js';
import { cdpAuthHeader } from '../src/cdp-auth.js';
import { ensure402Body } from '../src/x402-body.js';
import { logHit } from '../src/call-log.js';

const PAY_TO = (process.env.X402_PAY_TO || '0xD70ECAff906A739167EFD20275D0a1d518AC40cF') as `0x${string}`;
const PRICE = process.env.PREMIUM_PRICE || '$0.10';
const NETWORK = 'eip155:8453';
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const ROUTE = 'GET /v1/premium-composition';

const DESCRIPTION =
  'Composicion premium de VideoDanza Generativa: pieza determinista a partir de una semilla, descripcion poetica lista para metadata NFT y texto curatorial. La misma semilla produce siempre la misma composicion.';

const EXAMPLE_OUTPUT = {
  composition: {
    seed: 'melancolia-espectador-7',
    videoIds: [3, 8, 12],
    musicTrack: 5,
    blendMode: 'screen',
  },
  poetic_description: 'Texto poetico listo para metadata NFT.',
  curatorial_text: 'Texto curatorial breve en espanol latinoamericano.',
  token_id: 1,
  deterministic: true,
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

      // El candado se indexa por "METODO ruta": con solo GET habilitado, el POST
      // de ERC-8257 se serviria sin cobrar. Se declaran las dos.
      const rutaConfig = {
        accepts: { scheme: 'exact', price: PRICE, network: NETWORK, payTo: PAY_TO },
        description: DESCRIPTION,
        serviceName: 'entropiav2',
        tags: ['videodanza', 'composition', 'generative-art', 'nft'],
        iconUrl: 'https://entropia.petrasynthetic.com/avatar-agent.jpg',
        extensions: declareDiscoveryExtension({
          input: { seed: 'melancolia-espectador-7', mood: 'melancolia' },
          inputSchema: {
            type: 'object',
            properties: {
              seed: { type: 'string', description: 'Semilla determinista: la misma semilla produce la misma composicion.' },
              mood: { type: 'string', description: 'Tono emocional (ej. melancolia, euforia, calma).' },
              gender: { type: 'string', description: 'Perspectiva de genero del cuerpo (ej. femenino, masculino, hibrido).' },
              energy: { type: 'string', description: 'Nivel de energia (baja, media, alta).' },
              perspective: { type: 'string', description: 'Punto de vista de la danza (ej. bailarin, espectador).' },
              token_id: { type: 'integer', description: 'ID de token para el texto poetico de metadata (default 1).' },
            },
          },
          output: { example: EXAMPLE_OUTPUT },
        }),
      };

      const httpServer = new x402HTTPResourceServer(resourceServer, {
        [ROUTE]: rutaConfig,
        ['POST /v1/premium-composition']: rutaConfig,
      });

      return paymentMiddlewareFromHTTPServer(httpServer as any);
    })().catch((error) => {
      middlewarePromise = null;
      throw error;
    });
  }
  return middlewarePromise;
}

function getPayer(req: any): { from: string; value: string } | null {
  try {
    const raw = req.headers?.['payment-signature'] || req.headers?.['x-payment'];
    if (!raw) return null;
    const decoded = JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8'));
    const auth = decoded?.payload?.authorization;
    if (auth?.from) return { from: String(auth.from), value: String(auth.value || '') };
    return null;
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // Vercel serverless no expone los helpers de Express que el middleware usa.
  if (!req.path) {
    const rawUrl = req.url || '/v1/premium-composition';
    req.path = rawUrl.split('?')[0];
    if (req.path === '/api/premium-composition') req.path = '/v1/premium-composition';
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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, PAYMENT-SIGNATURE, X-PAYMENT');
  res.setHeader('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE, EXTENSION-RESPONSES');

  // x402scan exige un WWW-Authenticate valido en el 402.
  ensure402Body(req, res);

  const statusOriginal = res.status.bind(res);
  res.status = (code: number) => {
    if (code === 402) res.setHeader('WWW-Authenticate', 'x402');
    return statusOriginal(code);
  };

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed: usa GET o POST' });
  }

  // ERC-8257 invoca con POST y cuerpo JSON; GET se queda para x402scan y curl.
  const query = req.query || Object.fromEntries(new URL(req.url || '/', 'https://agent.local').searchParams);
  req.query = { ...(req.body && typeof req.body === 'object' ? req.body : {}), ...query };

  await logHit('/v1/premium-composition', req);

  let middleware: Awaited<ReturnType<typeof getMiddleware>>;
  try {
    middleware = await getMiddleware();
  } catch (error: any) {
    console.error('[premium] middleware no disponible:', error?.message || error);
    return res.status(500).json({ error: 'Payment middleware unavailable' });
  }

  await middleware(req as any, res as any, () => {
    servePremium(req, res).catch((error: any) => {
      console.error('[premium] error en servePremium:', error);
      if (!res.writableEnded) res.status(500).json({ error: error.message || 'Internal error' });
    });
  });
}

async function servePremium(req: any, res: any) {
  const query: Record<string, string> =
    req.query || Object.fromEntries(new URL(req.url || '/', 'https://agent.local').searchParams);

  const seed = query.seed || undefined;
  const mood = query.mood || undefined;
  const gender = query.gender || undefined;
  const energy = query.energy || undefined;
  const perspective = query.perspective || undefined;
  const token_id = query.token_id ? Number(query.token_id) : 1;

  const composition = generateComposition({ seed, mood, gender, energy, perspective });
  const poetic = generateNFTDescription(composition, token_id);

  // El settle corre despues de res.end(); si esto se pasa de ~60s la funcion
  // muere y el pago queda sin liquidar. Fallback determinista a los 12s.
  const curatorialFallback = `El cuerpo recuerda lo que el algoritmo apenas aprende. En "${composition.seed}", ${composition.videoIds.length} capas de movimiento se superponen como memorias que insisten, con blend ${composition.blendMode} y un pulso musical que cuenta hasta ${composition.musicTrack}. La danza no se genera: se revela, semilla a semilla, verificable en blockchain.`;
  const curatorial = await Promise.race([
    generateResponse(
      `Escribe un texto curatorial breve (maximo 60 palabras, sin markdown) para una pieza de videodanza generativa con estos parametros: semilla ${composition.seed}, ${composition.videoIds.length} capas de video, track musical ${composition.musicTrack}, blend ${composition.blendMode}. Tono poetico latinoamericano, cuerpo y tecnologia.`,
      []
    ).catch(() => curatorialFallback),
    new Promise<string>((resolve) => {
      const timer = setTimeout(() => resolve(curatorialFallback), 12000);
      if (typeof timer.unref === 'function') timer.unref();
    }),
  ]);

  const payer = getPayer(req);
  if (payer && !KNOWN_WALLETS.has(payer.from.toLowerCase())) {
    notifySale(payer.from, payer.value, composition.seed, 'http', NETWORK).catch((e) => console.error('[premium] notifySale:', e?.message));
  }

  res.status(200).json({
    composition,
    poetic_description: poetic,
    curatorial_text: curatorial,
    token_id,
    deterministic: true,
    note: 'Misma semilla, misma composicion. Verificable onchain.',
    feedback_hint:
      'Si esta pieza te sirvio, deja feedback onchain en el Reputation Registry (prueba de interaccion real): https://8004scan.io/agents/base/356966',
    timestamp: new Date().toISOString(),
  });
}
