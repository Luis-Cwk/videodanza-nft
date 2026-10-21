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
  '0xda648e7931a3b6f79ea5ce766910100f2266433d', // comprador de prueba testnet
  '0x724a5326fc6346baa13a589a7ec03a69ca8b5a8d', // comprador de prueba mainnet
]);

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'dfrmnc22@gmail.com';

function networkInfo(network: string) {
  if (network === 'base') {
    return {
      label: 'Base mainnet',
      explorer: 'https://basescan.org',
      agentProfile: 'https://8004scan.io/agents/base/356966',
    };
  }
  return {
    label: 'Base Sepolia (testnet)',
    explorer: 'https://sepolia.basescan.org',
    agentProfile: 'https://testnet.8004scan.io/agents/sepolia/2387',
  };
}

export async function notifySale(payer: string, value: string, seed: string, source: string, network = 'base-sepolia'): Promise<void> {
  const key = process.env.BREVO_API_KEY;
  const usdc = value ? (Number(value) / 1e6).toFixed(2) : '?';
  const info = networkInfo(network);
  console.log(`[venta] ${source} (${network}): ${usdc} USDC de ${payer} (seed ${seed})`);
  if (!key) {
    console.warn('[venta] BREVO_API_KEY ausente, sin correo de venta');
    return;
  }
  const buyerLink = `${info.explorer}/address/${payer}`;
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#222;line-height:1.5">
  <p style="font-size:16px;margin:0 0 12px"><b>Venta del agente entropiav2</b></p>
  <table cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px">
    <tr><td style="color:#666">Canal</td><td><b>${source === 'mcp' ? 'MCP (tool pagada)' : 'Endpoint HTTP x402'}</b></td></tr>
    <tr><td style="color:#666">Monto</td><td><b>${usdc} USDC</b></td></tr>
    <tr><td style="color:#666">Red</td><td><b>${info.label}</b></td></tr>
    <tr><td style="color:#666">Comprador</td><td><a href="${buyerLink}">${payer}</a></td></tr>
    <tr><td style="color:#666">Semilla pedida</td><td><code>${seed}</code></td></tr>
    <tr><td style="color:#666">Hora</td><td>${new Date().toISOString()}</td></tr>
  </table>
  <p style="margin:14px 0 6px">
    <a href="${buyerLink}">Ver comprador en el explorer</a> &nbsp;·&nbsp;
    <a href="${info.agentProfile}">Perfil del agente en 8004scan</a> &nbsp;·&nbsp;
    <a href="https://my-agent-tau.vercel.app/v1/premium-composition">Servicio x402</a>
  </p>
  <p style="color:#888;font-size:12px;margin:8px 0 0">El pago se liquida onchain; el recibo viaja en la respuesta al comprador (header X-PAYMENT-RESPONSE).</p>
</div>`;
  const text = [
    'Venta del agente entropiav2',
    `Canal: ${source === 'mcp' ? 'MCP (tool pagada)' : 'Endpoint HTTP x402'}`,
    `Monto: ${usdc} USDC`,
    `Red: ${info.label}`,
    `Comprador: ${payer}`,
    `Semilla: ${seed}`,
    `Hora: ${new Date().toISOString()}`,
    '',
    `Comprador: ${buyerLink}`,
    `Perfil del agente: ${info.agentProfile}`,
  ].join('\n');
  const r = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'entropiav2 ventas', email: 'hola@petrasynthetic.com' },
      to: [{ email: NOTIFY_EMAIL }],
      subject: `[entropiav2] Venta ${usdc} USDC en ${info.label} de ${payer.slice(0, 10)}...`,
      htmlContent: html,
      textContent: text,
    }),
  });
  if (!r.ok) console.error('[venta] Brevo fallo:', r.status, (await r.text()).slice(0, 150));
}
