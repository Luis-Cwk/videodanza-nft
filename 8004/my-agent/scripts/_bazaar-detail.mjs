// Barrido del Bazaar: muestra serviceName y tags de nuestras entradas.
const BASE = 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources';
const NEEDLES = ['petrasynthetic', '0xfc4f1119794dead15502afadb8c0069092e54e5f'];

let offset = 0;
let scanned = 0;
const hits = [];

for (let page = 0; page < 400; page++) {
  const r = await fetch(`${BASE}?limit=100&offset=${offset}`);
  if (!r.ok) break;
  const j = await r.json();
  const items = j.items || [];
  if (!items.length) break;
  scanned += items.length;
  for (const it of items) {
    const s = JSON.stringify(it).toLowerCase();
    if (NEEDLES.some((n) => s.includes(n))) hits.push(it);
  }
  const next = j.pagination?.next;
  offset = typeof next === 'number' ? next : offset + items.length;
  if (items.length < 100) break;
}

console.log(`revisados ${scanned}`);
for (const h of hits) {
  console.log(`${h.resource?.url || h.resource}`);
  console.log(`   serviceName=${h.serviceName ?? '(sin nombre)'}  tags=${(h.tags || []).join(',') || '-'}  updated=${h.lastUpdated}`);
}
