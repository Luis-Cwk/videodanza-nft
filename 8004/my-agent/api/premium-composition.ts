/**
 * Vercel Serverless Function - Premium Composition (x402, estilo TIA)
 * GET /api/premium-composition -> GET /v1/premium-composition
 *
 * Pago por llamada en USDC sobre Base Sepolia via x402.
 * Sin cuenta, sin API key: cada llamada se paga individual.
 * Flujo 402: llamada -> PAYMENT-REQUIRED header -> firma USDC -> reintento
 * con X-PAYMENT -> datos + recibo en X-PAYMENT-RESPONSE.
 */
import { paymentMiddleware } from 'x402-express';
import { generateComposition, generateNFTDescription, generateResponse } from '../src/agent.js';

// Wallet del agente (mismo address que agentWallet en el registro ERC-8004)
const PAY_TO = (process.env.X402_PAY_TO || '0x6bce199069a02917114dd8a9bdca5e6886f2afaa') as `0x${string}`;

const middleware = paymentMiddleware(
  PAY_TO,
  {
    'GET /v1/premium-composition': {
      price: '$0.10',
      network: 'base-sepolia',
      config: {
        description: 'Composicion premium de VideoDanza Generativa con descripcion poetica, parametros deterministas y texto curatorial listo para metadata NFT.',
      },
    },
  }
  // facilitator por defecto: https://x402.org/facilitator (testnet)
);

export default async function handler(req: any, res: any) {
  // Vercel serverless no expone req.path, req.protocol, req.header ni
  // req.originalUrl (son de Express). x402-express los necesita, asi que
  // los polypilleamos antes de llamarlo.
  if (!req.path) {
    const rawUrl = req.url || '/v1/premium-composition';
    req.path = rawUrl.split('?')[0];
    // la rewrite de Vercel entrega /api/premium-composition; normalizamos
    if (req.path === '/api/premium-composition') {
      req.path = '/v1/premium-composition';
    }
  }
  if (!req.originalUrl) {
    req.originalUrl = req.url || req.path;
  }
  if (!req.protocol) {
    req.protocol = 'https';
  }
  if (typeof req.header !== 'function') {
    req.header = (name: string) => {
      const v = req.headers?.[String(name).toLowerCase()];
      return Array.isArray(v) ? v[0] : v;
    };
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-PAYMENT');
  res.setHeader('Access-Control-Expose-Headers', 'X-PAYMENT-RESPONSE, X-PAYMENT');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // x402: si no viene pago valido, responde 402 con PAYMENT-REQUIRED y termina
  await middleware(req as any, res as any, () => {});
  if (res.writableEnded || res.headersSent) {
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed, usa GET' });
  }

  try {
    const t0 = Date.now();
    const query = req.query || {};
    const seed = (query.seed as string) || undefined;
    const mood = (query.mood as string) || undefined;
    const gender = (query.gender as string) || undefined;
    const energy = (query.energy as string) || undefined;
    const perspective = (query.perspective as string) || undefined;
    const token_id = query.token_id ? Number(query.token_id) : 1;

    const composition = generateComposition({ seed, mood, gender, energy, perspective });
    const poetic = generateNFTDescription(composition, token_id);

    // Texto curatorial: LLM con timeout corto y fallback determinista.
    // El settle de x402 corre despues del handler; si el LLM se pasa de
    // ~60s la funcion muere (504) y el pago queda sin liquidar.
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
    console.log(`[premium] composicion+curatorial en ${Date.now() - t0}ms`);

    return res.status(200).json({
      composition,
      poetic_description: poetic,
      curatorial_text: curatorial,
      token_id,
      deterministic: true,
      note: 'Misma semilla, misma composicion. Verificable onchain.',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal error' });
  }
}
