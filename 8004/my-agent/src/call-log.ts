// Una linea por llamada a una ruta pagada o al chat. Vercel Hobby guarda 1 hora
// de logs, asi que el registro vive fuera: un mensaje a Discord por llamada.
// Formato: ruta | PAGO/sin pago | pais | user agent | huella | notas
import { huella, ipDe } from './limite.js';

const TOKEN = process.env.DISCORD_TOKEN || '';
const CHANNEL = process.env.DISCORD_LOG_CHANNEL || '';

const UA_ESCANEO = /nmap|nikto|sqlmap|masscan|zgrab|nuclei|acunetix|dirbuster|gobuster|wfuzz/i;

export function banderaUA(ua: string): string {
  if (!ua || ua === '-') return 'sin-ua';
  if (ua.length < 5) return 'ua-corto';
  if (UA_ESCANEO.test(ua)) return 'ua-escaneo';
  return '';
}

export async function logHit(ruta: string, req: any, nota = ''): Promise<void> {
  if (!TOKEN || !CHANNEL) return;
  const h = req.headers || {};
  const pago = h['payment-signature'] || h['x-payment'] ? 'PAGO' : 'sin pago';
  const pais = String(h['x-vercel-ip-country'] || '??');
  const ua = String(h['user-agent'] || '-').slice(0, 100);
  const marcas = [banderaUA(ua), nota].filter(Boolean).join(',');
  const texto = `${ruta} | ${pago} | ${pais} | ${ua} | ${huella(ipDe(req))}${marcas ? ' | ' + marcas : ''}`;
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
