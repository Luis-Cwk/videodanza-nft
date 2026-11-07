/**
 * Cuerpo legible para el 402.
 *
 * El middleware de x402 v2 manda el desafio completo en el header
 * Payment-Required y deja el cuerpo vacio ({}). Un cliente x402 lo entiende,
 * pero un agente nuevo o una persona que prueba con curl ve un objeto vacio y
 * no sabe que hacer.
 *
 * Esto espeja el desafio en el cuerpo sin tocar los headers, que siguen siendo
 * la fuente de verdad. Si el middleware ya escribio un cuerpo util, no lo toca.
 */

function challengeFrom(res: any): any | null {
  try {
    const h = res.getHeader?.('Payment-Required') ?? res.getHeader?.('payment-required');
    if (!h) return null;
    const raw = Array.isArray(h) ? h[0] : h;
    return JSON.parse(Buffer.from(String(raw), 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

function buildBody(req: any, res: any) {
  const c = challengeFrom(res);
  const host = req.headers?.host || 'entropia.petrasynthetic.com';
  return {
    error: 'Payment required',
    x402Version: 2,
    resource: c?.resource || { url: `https://${host}${req.path || '/'}`, description: c?.resource?.description },
    accepts: c?.accepts || [],
    how_to_pay:
      'Paga con cualquier cliente x402 (USDC en Base, scheme exact) y reintenta la misma peticion con el header PAYMENT-SIGNATURE o X-PAYMENT. El desafio completo, identico, va en el header Payment-Required.',
    contract: `https://${host}/v1/contract`,
  };
}

function esVacio(chunk: any): boolean {
  if (chunk === undefined || chunk === null) return true;
  const s = String(chunk).trim();
  return s === '' || s === '{}';
}

/**
 * Envuelve res.json y res.end para rellenar el cuerpo del 402.
 * Llamar una sola vez, antes de invocar el middleware.
 */
export function ensure402Body(req: any, res: any): void {
  let inyectado = false;

  if (typeof res.json === 'function') {
    const jsonOriginal = res.json.bind(res);
    res.json = (body: any) => {
      if (res.statusCode === 402 && !inyectado && (!body || Object.keys(body).length === 0)) {
        inyectado = true;
        return jsonOriginal(buildBody(req, res));
      }
      return jsonOriginal(body);
    };
  }

  const endOriginal = res.end.bind(res);
  res.end = (chunk?: any, ...resto: any[]) => {
    if (res.statusCode === 402 && !inyectado && esVacio(chunk)) {
      inyectado = true;
      const cuerpo = JSON.stringify(buildBody(req, res));
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', Buffer.byteLength(cuerpo));
      return endOriginal(cuerpo, ...resto);
    }
    return endOriginal(chunk, ...resto);
  };
}
