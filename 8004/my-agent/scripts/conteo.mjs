// Cuenta el trafico del agente leyendo el canal de avisos (una linea por llamada).
// Uso: node scripts/conteo.mjs [paginas=3]
// Formato de linea: ruta | PAGO/sin pago | pais | user agent | huella | notas
import { readFileSync } from 'node:fs';

const CANAL = process.env.DISCORD_LOG_CHANNEL || '1566093433280401609';
const PAGINAS = Number(process.argv[2] || 3);

const env = readFileSync('C:/Users/petra/discord-bots/cyborg-petra-app/.env', 'utf8');
const TOKEN = (env.match(/^DISCORD_TOKEN\s*=\s*(.+)$/m) || [])[1]?.trim();
if (!TOKEN) {
  console.error('sin DISCORD_TOKEN');
  process.exit(1);
}

const lineas = [];
let antes = '';
for (let i = 0; i < PAGINAS; i++) {
  const url = `https://discord.com/api/v10/channels/${CANAL}/messages?limit=100${antes ? `&before=${antes}` : ''}`;
  let r = await fetch(url, { headers: { Authorization: `Bot ${TOKEN}` } });
  for (let intento = 0; r.status === 429 && intento < 2; intento++) {
    const espera = (await r.json().catch(() => ({}))).retry_after || 1;
    await new Promise((ok) => setTimeout(ok, espera * 1000));
    r = await fetch(url, { headers: { Authorization: `Bot ${TOKEN}` } });
  }
  if (!r.ok) {
    console.error(`Discord ${r.status}: ${(await r.text()).slice(0, 200)}`);
    process.exit(1);
  }
  const lote = await r.json();
  if (!Array.isArray(lote) || !lote.length) break;
  for (const m of lote) if (m.content && m.content.includes(' | ')) lineas.push({ texto: m.content, fecha: String(m.timestamp || '').slice(0, 10), ts: m.timestamp });
  antes = lote[lote.length - 1].id;
  if (lote.length < 100) break;
}

if (!lineas.length) {
  console.log('Sin registros en el canal.');
  process.exit(0);
}

const cuenta = (arr) => {
  const m = new Map();
  for (const x of arr) m.set(x, (m.get(x) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
};

const filas = lineas.map(({ texto, fecha, ts }) => {
  const p = texto.split(' | ').map((s) => s.trim());
  const extra = p.slice(5);
  const detalle = extra.find((x) => x.startsWith('agente ')) || '';
  return { fecha, ts, ruta: p[0], pago: p[1] === 'PAGO', pais: p[2], ua: p[3], huella: p[4] || '', notas: extra.filter((x) => x !== detalle).join(' '), detalle };
});

const top = (pares, n = 5) => pares.slice(0, n).map(([k, v]) => `  ${v.toString().padStart(3)}  ${k}`).join('\n') || '  sin datos';
const repetidas = (pares, minimo = 3) => pares.filter(([, v]) => v >= minimo);

const PRECIO = { '/v1/agent-check': 0.02, '/v1/premium-composition': 0.1, '/v1/prompt/analyze': 0.02 };
// El cliente x402 reintenta con firma antes de que el facilitador liquide: dos
// lineas PAGO del mismo llamante y ruta en menos de 2 minutos son un solo cobro.
const pagados = filas.filter((f) => f.pago).sort((a, b) => new Date(a.ts) - new Date(b.ts));
const cobros = [];
for (const f of pagados) {
  const previo = cobros.find(
    (c) => c.huella === f.huella && c.ruta === f.ruta && Math.abs(new Date(f.ts) - new Date(c.ts)) < 120000,
  );
  if (!previo) cobros.push(f);
}
const pagos = cobros.length;
const repetidos = pagados.length - pagos;
const ingreso = cobros.reduce((s, f) => s + (PRECIO[f.ruta] || 0), 0);
const sospechosas = filas.filter((f) => f.notas);
const conHuella = filas.filter((f) => f.huella);
const huellas = cuenta(conHuella.map((f) => f.huella));

console.log(`Registros: ${filas.length}`);
console.log(`Pagos: ${pagos}${repetidos ? ` (${repetidos} repetidos descartados)` : ''}  |  sin pago: ${filas.length - pagados.length}  |  con bandera: ${sospechosas.length}  |  ingreso: ${ingreso.toFixed(2)} USDC`);
console.log(`\nPor ruta:\n${top(cuenta(filas.map((f) => f.ruta)))}`);
console.log(`\nPor dia:\n${top(cuenta(filas.map((f) => f.fecha)))}`);
const agentes = cuenta(
  filas
    .filter((f) => f.ruta === '/v1/agent-check')
    .map((f) => f.detalle.replace(/^agente /, ''))
    .filter((x) => x && !x.includes('?')),
);
console.log(`\nAgentes consultados (${agentes.length} distintos):\n${top(agentes, 8)}`);
console.log(`\nPaises:\n${top(cuenta(filas.map((f) => f.pais)))}`);
console.log(`\nUser agents:\n${top(cuenta(filas.map((f) => f.ua.slice(0, 60))), 8)}`);
if (conHuella.length) {
  const repes = repetidas(huellas, 3);
  console.log(`\nLlamantes distintos: ${huellas.length}`);
  console.log(repes.length ? `Huellas con 3+ llamadas:\n${top(repes, 8)}` : 'Ninguna huella repite 3 o mas veces.');
}
if (sospechosas.length) {
  console.log(`\nBanderas:\n${top(cuenta(sospechosas.map((f) => f.notas)))}`);
}
