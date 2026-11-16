#!/usr/bin/env node
/**
 * Cuadre de cobros de entropiav2.
 *
 * Cruza las transferencias USDC que llegaron a la wallet del agente en Base
 * contra las lineas COBRO que el propio agente escribio en Discord. Sirve para
 * detectar dos cosas: un pago que entro y no se registro, o un COBRO sin
 * transferencia detras.
 *
 * Uso:
 *   node scripts/cuadre-cobros.mjs                 # ultimos 9 dias
 *   node scripts/cuadre-cobros.mjs --dias 30
 *   node scripts/cuadre-cobros.mjs --append        # agrega una linea al historico
 *
 * Variables: RPC_URL (default público de Base). El token y el canal de Discord
 * salen del .env del bot, que es el mismo que publica las lineas del agente.
 */
import { readFileSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';

const WALLET = '0xfc4f1119794dead15502afadb8c0069092e54e5f';
const USDC = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';
const TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const RPC = process.env.RPC_URL || 'https://base-rpc.publicnode.com';
const BOT_ENV = 'C:/Users/petra/discord-bots/cyborg-petra-app/.env';
const CANAL_DEFECTO = '1566093433280401609'; // #general del servidor Petra
const HISTORICO = 'C:/Users/petra/agentex/documentos/entropia/cuadre.log';

const args = process.argv.slice(2);
const val = (name, def) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
};
const DIAS = Number(val('--dias', 9));
const CANAL = val('--canal', CANAL_DEFECTO);
const APPEND = args.includes('--append');

const rpc = async (method, params) => {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result;
};

const tokenBot = () => {
  try {
    const env = readFileSync(BOT_ENV, 'utf8');
    const linea = env.split(/\r?\n/).find((l) => l.startsWith('DISCORD_TOKEN='));
    return linea ? linea.slice('DISCORD_TOKEN='.length).trim() : '';
  } catch {
    return '';
  }
};

async function transferencias(desde, hasta) {
  const topic2 = '0x' + WALLET.slice(2).padStart(64, '0');
  const out = [];
  let paso = 200000;
  for (let inicio = desde; inicio <= hasta; ) {
    const fin = Math.min(inicio + paso - 1, hasta);
    try {
      const logs = await rpc('eth_getLogs', [{
        address: USDC,
        fromBlock: '0x' + inicio.toString(16),
        toBlock: '0x' + fin.toString(16),
        topics: [TRANSFER, null, topic2],
      }]);
      for (const l of logs) {
        out.push({
          tx: l.transactionHash,
          bloque: Number(l.blockNumber),
          from: '0x' + l.topics[1].slice(26),
          usdc: Number(l.data) / 1e6,
        });
      }
      inicio = fin + 1;
    } catch (e) {
      if (paso > 10000) { paso = Math.floor(paso / 2); continue; } // el RPC limita el rango
      throw e;
    }
  }
  return out;
}

/** Bloque cuyo timestamp es el mas cercano hacia atras de tsSegundos. */
async function bloquePorTiempo(tsSegundos, head) {
  let lo = 0;
  let hi = head;
  while (lo < hi) {
    const mid = Math.floor((lo + hi + 1) / 2);
    const bloque = await rpc('eth_getBlockByNumber', ['0x' + mid.toString(16), false]);
    if (Number(bloque.timestamp) <= tsSegundos) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

async function cobrosDiscord(desdeIso) {
  const token = tokenBot();
  if (!token) return { lineas: [], error: 'sin token de Discord' };
  const lineas = [];
  let cursor = null;
  for (let i = 0; i < 50; i++) {
    const url = `https://discord.com/api/v10/channels/${CANAL}/messages?limit=100${cursor ? `&before=${cursor}` : ''}`;
    let res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
    if (res.status === 429) {
      const cuerpo = await res.json().catch(() => ({}));
      await dormir(Math.min(5000, Math.ceil((cuerpo.retry_after || 1) * 1000) + 250));
      res = await fetch(url, { headers: { Authorization: `Bot ${token}` } });
    }
    if (!res.ok) return { lineas, error: `Discord HTTP ${res.status}` };
    const pagina = await res.json();
    if (!pagina.length) break;
    for (const m of pagina) {
      const match = m.content.match(/\| COBRO \| (0x[0-9a-fA-F]{64})/);
      if (match) lineas.push({ tx: match[1].toLowerCase(), fecha: m.timestamp, texto: m.content });
    }
    cursor = pagina[pagina.length - 1].id;
    const masViejo = pagina[pagina.length - 1].timestamp;
    if (masViejo < desdeIso) break;
    await dormir(1100); // el canal limita a 5 peticiones por 5 s
  }
  return { lineas, error: null };
}

const head = Number(await rpc('eth_blockNumber', []));
// Base produce ~5 bloques por segundo (bloques de 200 ms). Se usa eso para
// estimar la ventana; si cambia el ritmo, ajustar con --desde-bloque.
const desdeBloque = args.includes('--desde-bloque')
  ? Number(val('--desde-bloque', 0))
  : Math.max(0, head - Math.ceil(DIAS * 86400 * 5));
const desdeIso = new Date(Date.now() - DIAS * 86400 * 1000).toISOString();

const [transferenciasLista, discord] = await Promise.all([
  transferencias(desdeBloque, head),
  cobrosDiscord(desdeIso),
]);

const enCadena = new Map(transferenciasLista.map((t) => [t.tx.toLowerCase(), t]));
const registrados = new Map(discord.lineas.map((c) => [c.tx, c]));

const faltantes = [...enCadena.values()].filter((t) => !registrados.has(t.tx.toLowerCase()));
const sobrantes = [...registrados.values()].filter((c) => !enCadena.has(c.tx));

const total = transferenciasLista.reduce((s, t) => s + t.usdc, 0);

console.log(`Ventana: ultimos ${DIAS} dias (bloques ${desdeBloque} a ${head})`);
console.log(`Transferencias USDC a la wallet: ${transferenciasLista.length} (${total.toFixed(2)} USDC)`);
console.log(`Lineas COBRO en Discord: ${registrados.size}`);
if (discord.error) console.log(`Aviso: ${discord.error}`);
console.log(`Faltantes (pago sin COBRO): ${faltantes.length}`);
for (const f of faltantes) {
  const fecha = new Date((await rpc('eth_getBlockByNumber', ['0x' + f.bloque.toString(16), false])).timestamp * 1000).toISOString();
  console.log(`  ${fecha} | ${f.usdc} USDC | payer ${f.from} | ${f.tx}`);
}
console.log(`Sobrantes (COBRO sin transferencia): ${sobrantes.length}`);
for (const s of sobrantes) console.log(`  ${s.fecha} | ${s.tx}`);

const resumen = `${new Date().toISOString()} | dias=${DIAS} | pagos=${transferenciasLista.length} (${total.toFixed(2)} USDC) | cobro=${registrados.size} | faltan=${faltantes.length} | sobran=${sobrantes.length}`;
if (APPEND) {
  if (!existsSync(dirname(HISTORICO))) mkdirSync(dirname(HISTORICO), { recursive: true });
  appendFileSync(HISTORICO, resumen + '\n', 'utf8');
  console.log(`\nAgregado a ${HISTORICO}`);
}
