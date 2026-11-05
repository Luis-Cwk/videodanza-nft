// Busca nuestras rutas pagadas en el catalogo publico del Bazaar de CDP.
// Uso: node scripts/check-bazaar.mjs
const BASE = 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources';
const NEEDLES = ['petrasynthetic', '0xfc4f1119794dead15502afadb8c0069092e54e5f'];

let scanned = 0;
let total = null;
const hits = [];

for (let offset = 0; offset < 60000; offset += 100) {
  const r = await fetch(`${BASE}?limit=100&offset=${offset}`);
  if (!r.ok) {
    console.log('catalogo respondio', r.status, 'en offset', offset);
    break;
  }
  const j = await r.json();
  const items = j.items || [];
  total = j.total ?? total;
  scanned += items.length;
  for (const it of items) {
    const s = JSON.stringify(it).toLowerCase();
    if (NEEDLES.some((n) => s.includes(n))) hits.push(it);
  }
  if (items.length < 100) break;
}

console.log(`revisados ${scanned}${total ? ` de ${total}` : ''}`);
if (hits.length === 0) {
  console.log('nuestras rutas todavia no aparecen en el catalogo');
} else {
  for (const h of hits) {
    console.log('\nLISTADO:', h.resource?.url || h.resource || '?');
    console.log(JSON.stringify(h).slice(0, 600));
  }
}
