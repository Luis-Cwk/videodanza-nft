/**
 * Aviso de ventas compartido (HTTP premium + tool MCP pagada).
 * Manda correo via Brevo cuando paga una wallet NUEVA (no tester/owner/agente/comprador de prueba).
 */

export const KNOWN_WALLETS = new Set([
  '0x9732e0f07b17b1360d15f2456fc5f2baf858dd13', // tester 1
  '0xd8a2924f57cd8b6a07c20a599101b52da5e11931', // tester 2
  '0x335eb588c43c6ce50565cba38118ffd258c4e9d2', // tester 3
  '0xd70ecaff906a739167efd20275d0a1d518ac40cf', // owner
  '0xfc4f1119794dead15502afadb8c0069092e54e5f', // wallet operativa del agente (payTo)
  '0xda648e7931a3b6f79ea5ce766910100f2266433d', // comprador de prueba (.buyer-test.json)
]);

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'dfrmnc22@gmail.com';

export async function notifySale(payer: string, value: string, seed: string, source: string): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  const usdc = value ? (Number(value) / 1e6).toFixed(2) : '?';
  console.log(`[venta] ${source}: ${usdc} USDC de ${payer} (seed ${seed})`);
  if (!key) {
    console.warn('[venta] BREVO_API_KEY ausente, sin correo de venta');
    return;
  }
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'entropiav2 ventas', email: 'hola@petrasynthetic.com' },
      to: [{ email: NOTIFY_EMAIL }],
      subject: `[entropiav2] Venta (${source}): ${usdc} USDC de ${payer.slice(0, 10)}...`,
      htmlContent: `<p><b>Venta del agente entropiav2</b> (via ${source})</p>
        <p><b>Comprador:</b> ${payer}</p>
        <p><b>Monto:</b> ${usdc} USDC (Base Sepolia)</p>
        <p><b>Semilla pedida:</b> ${seed}</p>
        <p><b>Hora:</b> ${new Date().toISOString()}</p>
        <p><a href="https://sepolia.basescan.org/address/${payer}">Ver comprador en Basescan</a></p>`,
    }),
  });
  if (!r.ok) console.error('[venta] Brevo fallo:', r.status, (await r.text()).slice(0, 150));
}
