// Una linea por llamada a una ruta pagada. Vercel Hobby guarda 1 hora de logs,
// asi que el registro vive fuera: un mensaje a Discord por llamada.
const TOKEN = process.env.DISCORD_TOKEN || '';
const CHANNEL = process.env.DISCORD_LOG_CHANNEL || '';

export async function logHit(ruta: string, req: any): Promise<void> {
  if (!TOKEN || !CHANNEL) return;
  const h = req.headers || {};
  const pago = h['payment-signature'] || h['x-payment'] ? 'PAGO' : 'sin pago';
  const pais = String(h['x-vercel-ip-country'] || '??');
  const ua = String(h['user-agent'] || '-').slice(0, 100);
  const texto = `${ruta} | ${pago} | ${pais} | ${ua}`;
  try {
    await fetch(`https://discord.com/api/v10/channels/${CHANNEL}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bot ${TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: texto }),
      signal: AbortSignal.timeout(1200),
    });
  } catch {
    // el registro nunca debe tumbar la llamada
  }
}
