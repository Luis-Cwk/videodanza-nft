// Registro del agente fuera de Vercel. Tres formas de linea:
//   ruta | con firma/sin pago | pais | ua | huella | notas   (cada peticion)
//   ruta | COBRO | tx | payer | huella                       (liquidacion confirmada)
//   ruta | firma sin recibo | HTTP status | huella           (firma sin liquidar)
// Los pagos y cobros avisan a Discord. Los intentos sin pago van a un canal de
// registro si DISCORD_UNPAID_CHANNEL existe; si no, quedan como JSON en el log.
import { huella, ipDe } from './limite.js';

const TOKEN = process.env.DISCORD_TOKEN || '';
const CHANNEL = process.env.DISCORD_LOG_CHANNEL || '';
// Intentos sin pago: si hay un canal de registro aparte, van ahi; si no, se
// quedan como linea JSON en el log y NO notifican. Con LOG_UNPAID_DISCORD=1
// vuelven al canal principal, por si se quiere ver todo junto.
const CANAL_SIN_PAGO = process.env.DISCORD_UNPAID_CHANNEL || '';
const SIN_PAGO_A_PRINCIPAL = process.env.LOG_UNPAID_DISCORD === '1';

const UA_ESCANEO = /nmap|nikto|sqlmap|masscan|zgrab|nuclei|acunetix|dirbuster|gobuster|wfuzz/i;

export function banderaUA(ua: string): string {
  if (!ua || ua === '-') return 'sin-ua';
  if (UA_ESCANEO.test(ua)) return 'ua-escaneo';
  return '';
}

async function enviar(texto: string, canal = CHANNEL): Promise<void> {
  if (!TOKEN || !canal) return;
  try {
    await fetch(`https://discord.com/api/v10/channels/${canal}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: texto.slice(0, 1900) }),
      signal: AbortSignal.timeout(1200),
    });
  } catch {
    // el registro nunca debe tumbar la llamada
  }
}

export async function logHit(ruta: string, req: any, nota = '', detalle = ''): Promise<void> {
  const h = req.headers || {};
  const firma = Boolean(h['payment-signature'] || h['x-payment']);
  const pago = firma ? 'con firma' : 'sin pago';
  const pais = String(h['x-vercel-ip-country'] || '??');
  const ua = String(h['user-agent'] || '-').slice(0, 100);
  const extras = [[banderaUA(ua), nota].filter(Boolean).join(','), detalle].filter(Boolean).join(' | ');
  const linea = `${ruta} | ${pago} | ${pais} | ${ua} | ${huella(ipDe(req))}${extras ? ' | ' + extras : ''}`;
  if (firma || SIN_PAGO_A_PRINCIPAL) {
    await enviar(linea);
    return;
  }
  if (CANAL_SIN_PAGO) {
    // Canal de registro: todo, pero en un hilo aparte del aviso principal.
    await enviar(linea, CANAL_SIN_PAGO);
    return;
  }
  // Intento sin pago: una linea JSON al log del servidor, sin tocar Discord.
  console.log(JSON.stringify({
    t: new Date().toISOString(),
    ruta,
    pago: 'sin pago',
    pais,
    ua,
    huella: huella(ipDe(req)),
    nota: nota || undefined,
    detalle: detalle || undefined,
  }));
}

function reciboDe(res: any): any | null {
  const bruto =
    res.getHeader?.('PAYMENT-RESPONSE') ??
    res.getHeader?.('payment-response') ??
    res.getHeader?.('X-PAYMENT-RESPONSE');
  if (!bruto) return null;
  try {
    const texto = Buffer.from(String(bruto), 'base64').toString('utf8');
    return JSON.parse(texto);
  } catch {
    return null;
  }
}

/**
 * Registra el desenlace del pago cuando la respuesta termina. Se llama una vez,
 * antes del middleware. El hash de liquidacion lo pone el facilitador en el
 * header PAYMENT-RESPONSE. Si hubo firma y no hay recibo exitoso, se registra
 * igual: un 200 con firma puede haber movido dinero aunque falte el header
 * (paso el 16 nov 2026 con el pago de python-requests).
 */
export function cobroAlTerminar(ruta: string, req: any, res: any): void {
  const h = req.headers || {};
  const firma = Boolean(h['payment-signature'] || h['x-payment']);
  res.once?.('finish', () => {
    const recibo = reciboDe(res);
    if (recibo?.success) {
      const tx = String(recibo.transaction || 'sin-tx');
      const pagador = String(recibo.payer || 'sin-payer');
      void enviar(`${ruta} | COBRO | ${tx} | ${pagador} | ${huella(ipDe(req))}`);
      return;
    }
    if (firma) {
      const estado = Number(res.statusCode || 0);
      const motivo = recibo ? 'recibo sin success' : 'sin header de recibo';
      void enviar(`${ruta} | firma sin recibo | HTTP ${estado} | ${motivo} | ${huella(ipDe(req))}`);
    }
  });
}
