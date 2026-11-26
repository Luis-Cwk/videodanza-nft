/**
 * Vercel Serverless Function - Prompt desde una imagen (x402 v2)
 * POST /api/prompt-analyze -> POST /v1/prompt/analyze
 *
 * Entra una imagen publica, sale el prompt que la describe: encuadre, gesto,
 * luz, paleta, medio, camara, mas el prompt final y el negativo.
 *
 * Por que asi: la pregunta "cual es el prompt" se hace todo el dia en arte
 * generativo, y nadie la responde en el ecosistema x402. La vision corre en
 * OpenRouter (Qwen3-VL); costo medido ~$0.0012 por llamada, precio $0.02.
 *
 * Limites honestos: describe, no recupera el prompt original, y no reproduce
 * la imagen. Ver ESTUDIO-MERCADO-2026-11-05.md.
 */
import { paymentMiddlewareFromHTTPServer } from '@x402/express';
import { HTTPFacilitatorClient, x402HTTPResourceServer, x402ResourceServer } from '@x402/core/server';
import { registerExactEvmScheme } from '@x402/evm/exact/server';
import { bazaarResourceServerExtension } from '@x402/extensions/bazaar';
import { declararDescubrimiento } from '../src/bazaar.js';
import { cdpAuthHeader } from '../src/cdp-auth.js';
import { ensure402Body } from '../src/x402-body.js';
import { cobroAlTerminar, logHit } from '../src/call-log.js';
import { analizarImagen } from '../src/prompt-vision.js';
import { ipDe, limite, permitido } from '../src/limite.js';

const PAY_TO = (process.env.X402_PAY_TO || '0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f') as `0x${string}`;
const PRICE = process.env.PROMPT_PRICE || '$0.02';
const NETWORK = 'eip155:8453';
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const ROUTE = 'POST /v1/prompt/analyze';
const LIMITE_PREVIEW_DIA = limite('LIMITE_PROMPT_PREVIEW_DIA', 10);

const DESCRIPTION =
  'Read a picture and hand back the prompt that describes it: framing and aspect ratio, the gesture and contact between bodies, light direction and hardness, palette, medium, and camera. Returns a ready prompt plus a negative prompt and the six structured fields. Use it when you need to describe, remix or extend an image you did not make. It describes the image; it does not recover the original prompt and does not regenerate the picture.';

const EXAMPLE_OUTPUT = {
  schema_version: '1.0.0',
  ok: true,
  image: { content_type: 'image/jpeg', bytes: 204800 },
  analysis: {
    framing: 'medium shot, 16:9, subject right of centre, large black negative space on the left',
    gesture: 'one figure carries the other horizontally, faces close',
    light: 'single hard source from upper left, floor dimly lit',
    palette: 'monochrome, three luminance levels',
    medium: 'photograph, visible grain',
    camera: 'telephoto, shallow depth',
  },
  prompt: 'Medium shot, 16:9, one figure carries another horizontally against a black stage, faces close...',
  negative: 'colour, text, watermark',
  fields_completed: 6,
  model: 'qwen/qwen3-vl-235b-a22b-instruct',
  elapsed_ms: 2700,
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
          resource: 'https://entropia.petrasynthetic.com/v1/prompt/analyze',
          serviceName: 'entropiav2',
          tags: ['prompt', 'image', 'creative', 'vision'],
          iconUrl: 'https://entropia.petrasynthetic.com/avatar-agent.jpg',
          extensions: declararDescubrimiento({
            method: 'POST',
            bodyType: 'json',
            input: { image_url: 'https://example.com/photo.jpg' },
            inputSchema: {
              type: 'object',
              properties: {
                image_url: { type: 'string', description: 'URL HTTPS publica de la imagen (jpg, png, webp).' },
              },
              required: ['image_url'],
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
  if (!req.path) {
    const rawUrl = req.url || '/v1/prompt/analyze';
    req.path = rawUrl.split('?')[0];
    if (req.path === '/api/prompt-analyze') req.path = '/v1/prompt/analyze';
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

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method === 'GET') return servePreview(req, res);

  ensure402Body(req, res);
  cobroAlTerminar('/v1/prompt/analyze', req, res);

  const statusOriginal = res.status.bind(res);
  res.status = (code: number) => {
    if (code === 402) res.setHeader('WWW-Authenticate', 'x402');
    return statusOriginal(code);
  };

  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed, usa POST' });

  await logHit('/v1/prompt/analyze', req);

  let middleware: Awaited<ReturnType<typeof getMiddleware>>;
  try {
    middleware = await getMiddleware();
  } catch (error: any) {
    console.error('[prompt] middleware no disponible:', error?.message || error);
    return res.status(500).json({ error: 'Payment middleware unavailable' });
  }

  await middleware(req as any, res as any, () => {
    servePrompt(req, res).catch((error: any) => {
      console.error('[prompt] error:', error?.message || error);
      if (!res.writableEnded) res.status(500).json({ error: 'Internal error' });
    });
  });
}

async function servePrompt(req: any, res: any) {
  const body = req.body || {};
  const imageUrl = String(body.image_url || '').trim();

  if (!/^https:\/\/\S+$/i.test(imageUrl)) {
    return res.status(400).json({ error: 'image_url debe ser una URL HTTPS publica' });
  }

  const resultado = await analizarImagen(imageUrl);
  if (!resultado.ok) {
    return res.status(resultado.status).json(resultado.body);
  }

  res.status(200).json({
    schema_version: '1.0.0',
    ok: true,
    ...resultado.data,
    note: 'Describe la imagen; no recupera el prompt original ni la reproduce.',
  });
}

function recorte(texto: string, max: number): string {
  const limpio = String(texto).trim();
  if (limpio.length <= max) return limpio;
  const corte = limpio.slice(0, max);
  const espacio = corte.lastIndexOf(' ');
  return (espacio > 40 ? corte.slice(0, espacio) : corte).trim() + '…';
}

/**
 * GET gratis: dos de los seis campos y un recorte del prompt. Corre el mismo
 * modelo que la ruta pagada. Limite best-effort por IP porque la vision cuesta
 * ~$0.0012 por llamada.
 */
async function servePreview(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store');

  const cupo = permitido(ipDe(req), 'prompt-preview', LIMITE_PREVIEW_DIA, 2);
  if (!cupo.ok) {
    return res.status(429).json({
      error: `Limite gratuito alcanzado (${LIMITE_PREVIEW_DIA}/dia por IP)`,
      full_report: 'POST /v1/prompt/analyze ($0.02 USDC en Base, sin cuenta)',
    });
  }
  res.setHeader('X-Preview-Remaining', String(Math.max(0, LIMITE_PREVIEW_DIA - cupo.usados)));

  const query: Record<string, string> =
    req.query || Object.fromEntries(new URL(req.url || '/', 'https://agent.local').searchParams);
  const imageUrl = String(query.image_url || '').trim();

  if (!/^https:\/\/\S+$/i.test(imageUrl)) {
    return res.status(400).json({
      error: 'image_url debe ser una URL HTTPS publica',
      example: '/v1/prompt/preview?image_url=https://example.com/photo.jpg',
    });
  }

  const resultado = await analizarImagen(imageUrl);
  if (!resultado.ok) {
    return res.status(resultado.status).json(resultado.body);
  }

  const { analysis, image, prompt, fields_completed, model, elapsed_ms } = resultado.data;

  res.status(200).json({
    ok: true,
    preview: true,
    image,
    analysis: {
      framing: analysis.framing,
      palette: analysis.palette,
    },
    prompt_short: recorte(prompt, 180),
    fields_completed,
    withheld: ['gesture', 'light', 'medium', 'camera', 'prompt completo', 'negative'],
    full_report: 'POST /v1/prompt/analyze ($0.02 USDC en Base, sin cuenta)',
    model,
    elapsed_ms,
    note: 'Vista gratuita y best-effort: dos de seis campos. El reporte completo tambien entrega el negativo.',
  });
}
