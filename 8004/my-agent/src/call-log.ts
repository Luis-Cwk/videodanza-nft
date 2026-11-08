// Registro del agente fuera de Vercel: un mensaje a Discord por evento.
// Dos formas de linea:
//   ruta | PAGO/sin pago | pais | ua | huella | notas   (cada peticion)
//   ruta | COBRO | tx | payer | huella                   (cada liquidacion)
// El conteo de dinero usa COBRO: una por liquidacion real, sin deduplicar por tiempo.
import { huella, ipDe } from './limite.js';

const TOKEN = process.env.DISCORD_TOKEN || '';
const CHANNEL = process.env.DISCORD_LOG_CHANNEL || '';

const UA_ESCANEO = /nmap|nikto|sqlmap|masscan|zgrab|nuclei|acunetix|dirbuster|gobuster|wfuzz/i;

export function banderaUA(ua: string): string {
  if (!ua || ua === '-') return 'sin-ua';
  if (UA_ESCANEO.test(ua)) return 'ua-escaneo';
  return '';
}

async function enviar(texto: string): Promise<void> {
  if (!TOKEN || !CHANNEL) return;
  try {
    await fetch(`https://discord.com/api/v10/channels/${CHANNEL}/messages`, {
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
  const pago = h['payment-signature'] || h['x-payment'] ? 'PAGO' : 'sin pago';
  const pais = String(h['x-vercel-ip-country'] || '??');
  const ua = String(h['user-agent'] || '-').slice(0, 100);
  const extras = [[banderaUA(ua), nota].filter(Boolean).join(','), detalle].filter(Boolean).join(' | ');
  await enviar(`${ruta} | ${pago} | ${pais} | ${ua} | ${huella(ipDe(req))}${extras ? ' | ' + extras : ''}`);
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
 * Registra el cobro cuando la respuesta termina. Se llama una vez, antes del
 * middleware. El hash de liquidacion lo pone el facilitador en el header
 * PAYMENT-RESPONSE; si no hay header, no hubo cobro y no se registra nada.
 */
export function cobroAlTerminar(ruta: string, req: any, res: any): void {
  res.once?.('finish', () => {
    const recibo = reciboDe(res);
    if (!recibo?.success) return;
    const tx = String(recibo.transaction || 'sin-tx');
    const pagador = String(recibo.payer || 'sin-payer');
    void enviar(`${ruta} | COBRO | ${tx} | ${pagador} | ${huella(ipDe(req))}`);
  });
}
