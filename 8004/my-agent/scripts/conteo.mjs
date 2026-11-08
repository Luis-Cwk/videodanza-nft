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
  for (const m of lote) if (m.content && m.content.includes(' | ')) lineas.push({ texto: m.content, fecha: String(m.timestamp || '').slice(0, 10) });
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

const filas = lineas.map(({ texto, fecha }) => {
  const p = texto.split(' | ').map((s) => s.trim());
  return { fecha, ruta: p[0], pago: p[1] === 'PAGO', pais: p[2], ua: p[3], huella: p[4] || '', notas: p.slice(5).join(' ') };
});

const top = (pares, n = 5) => pares.slice(0, n).map(([k, v]) => `  ${v.toString().padStart(3)}  ${k}`).join('\n') || '  sin datos';
const repetidas = (pares, minimo = 3) => pares.filter(([, v]) => v >= minimo);

const pagos = filas.filter((f) => f.pago).length;
const sospechosas = filas.filter((f) => f.notas);
const conHuella = filas.filter((f) => f.huella);
const huellas = cuenta(conHuella.map((f) => f.huella));

console.log(`Registros: ${filas.length}`);
console.log(`Pagos: ${pagos}  |  sin pago: ${filas.length - pagos}  |  con bandera: ${sospechosas.length}`);
console.log(`\nPor ruta:\n${top(cuenta(filas.map((f) => f.ruta)))}`);
console.log(`\nPor dia:\n${top(cuenta(filas.map((f) => f.fecha)))}`);
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
