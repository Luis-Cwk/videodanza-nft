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
import { bazaarResourceServerExtension, declareDiscoveryExtension } from '@x402/extensions/bazaar';
import { cdpAuthHeader } from '../src/cdp-auth.js';
import { ensure402Body } from '../src/x402-body.js';
import { cobroAlTerminar, logHit } from '../src/call-log.js';

const PAY_TO = (process.env.X402_PAY_TO || '0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f') as `0x${string}`;
const PRICE = process.env.PROMPT_PRICE || '$0.02';
const NETWORK = 'eip155:8453';
const FACILITATOR_URL = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';
const ROUTE = 'POST /v1/prompt/analyze';
const MODEL = process.env.PROMPT_VISION_MODEL || 'google/gemini-3.1-flash-lite';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 15000;
const MODEL_TIMEOUT_MS = 40000;

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

const INSTRUCCION = `You are a cinematographer writing prompts for image generation models. Describe the image with exact, checkable observations. No adjective you cannot defend by pointing at the picture.

Answer ONLY with a JSON object, no prose, with exactly these keys:

{"framing":"shot size, aspect ratio, where the subject sits, how much empty space and on which side","gesture":"what each body is doing, relative positions, orientation, contact, and whether one is lifted or held","light":"direction, hardness, what is lit and what falls to shadow","palette":"values and colours, how many tones","medium":"photograph, render, painting or other, and what gives it away","camera":"lens feel, distance, depth of field","prompt":"45 to 70 words in English, built only from the fields above, starting with framing and gesture and ending with medium and light, no mood words","negative":"what must not appear"}

If a field cannot be determined from the image, use an empty string for it. Never guess.`;

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
          tags: ['prompt', 'image', 'creative', 'vision'],
          iconUrl: 'https://entropia.petrasynthetic.com/avatar-agent.jpg',
          extensions: declareDiscoveryExtension({
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, PAYMENT-SIGNATURE, X-PAYMENT');
  res.setHeader('Access-Control-Expose-Headers', 'PAYMENT-REQUIRED, PAYMENT-RESPONSE, X-PAYMENT-RESPONSE, EXTENSION-RESPONSES');

  ensure402Body(req, res);
  cobroAlTerminar('/v1/prompt/analyze', req, res);

  const statusOriginal = res.status.bind(res);
  res.status = (code: number) => {
    if (code === 402) res.setHeader('WWW-Authenticate', 'x402');
    return statusOriginal(code);
  };

  if (req.method === 'OPTIONS') return res.status(200).end();
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

function jsonFromText(text: string): any | null {
  const limpio = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const ini = limpio.indexOf('{');
  const fin = limpio.lastIndexOf('}');
  if (ini < 0 || fin <= ini) return null;
  try {
    return JSON.parse(limpio.slice(ini, fin + 1));
  } catch {
    return null;
  }
}

async function servePrompt(req: any, res: any) {
  const t0 = Date.now();
  const body = req.body || {};
  const imageUrl = String(body.image_url || '').trim();

  if (!/^https:\/\/\S+$/i.test(imageUrl)) {
    return res.status(400).json({ error: 'image_url debe ser una URL HTTPS publica' });
  }

  // Descargar la imagen con tope de bytes y de tiempo.
  let imgRes: Response;
  try {
    imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS), redirect: 'follow' });
  } catch (e: any) {
    return res.status(422).json({ error: 'no se pudo descargar la imagen', detail: e?.name || 'fetch error' });
  }
  if (!imgRes.ok) {
    return res.status(422).json({ error: `la imagen respondio ${imgRes.status}` });
  }
  const tipo = (imgRes.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  if (!tipo.startsWith('image/')) {
    return res.status(422).json({ error: `content-type no es imagen: ${tipo || 'vacio'}` });
  }

  const buf = Buffer.from(await imgRes.arrayBuffer());
  if (buf.length > MAX_BYTES) {
    return res.status(413).json({ error: `imagen de ${Math.round(buf.length / 1024 / 1024)} MB, tope 8 MB` });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('[prompt] falta OPENROUTER_API_KEY');
    return res.status(500).json({ error: 'vision no configurada' });
  }

  const dataUrl = `data:${tipo};base64,${buf.toString('base64')}`;
  let modelo: any;
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: [{ type: 'text', text: INSTRUCCION }, { type: 'image_url', image_url: { url: dataUrl } }] }],
        max_tokens: 800,
        temperature: 0,
      }),
      signal: AbortSignal.timeout(MODEL_TIMEOUT_MS),
    });
    modelo = await r.json();
    if (!r.ok || modelo?.error) {
      console.error('[prompt] openrouter:', r.status, JSON.stringify(modelo?.error || {}).slice(0, 200));
      return res.status(502).json({ error: 'el modelo de vision fallo', status: r.status });
    }
  } catch (e: any) {
    return res.status(504).json({ error: 'el modelo de vision no respondio a tiempo' });
  }

  const texto = modelo?.choices?.[0]?.message?.content || '';
  const parsed = jsonFromText(texto);
  if (!parsed) {
    console.error('[prompt] respuesta no parseable:', String(texto).slice(0, 200));
    return res.status(502).json({ error: 'el modelo no devolvio JSON valido' });
  }

  const campos = ['framing', 'gesture', 'light', 'palette', 'medium', 'camera'] as const;
  const analysis: Record<string, string> = {};
  let completos = 0;
  for (const c of campos) {
    const v = typeof parsed[c] === 'string' ? parsed[c].trim() : '';
    analysis[c] = v;
    if (v) completos++;
  }

  res.status(200).json({
    schema_version: '1.0.0',
    ok: true,
    image: { content_type: tipo, bytes: buf.length },
    analysis,
    prompt: typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '',
    negative: typeof parsed.negative === 'string' ? parsed.negative.trim() : '',
    fields_completed: completos,
    model: MODEL,
    elapsed_ms: Date.now() - t0,
    note: 'Describe la imagen; no recupera el prompt original ni la reproduce.',
  });
}
