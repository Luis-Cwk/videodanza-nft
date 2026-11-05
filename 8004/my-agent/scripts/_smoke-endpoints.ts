// Prueba de humo de los dos endpoints nuevos. Se corre con tsx y se borra.
import contract from '../api/contract.js';
import preview from '../api/agent-check-preview.js';

function mockRes() {
  const out: any = { headers: {}, statusCode: 0, body: null };
  const res: any = {
    setHeader: (k: string, v: string) => { out.headers[k] = v; },
    status: (c: number) => { out.statusCode = c; return res; },
    json: (b: any) => { out.body = b; return res; },
    end: () => res,
    get writableEnded() { return out.body !== null; },
  };
  return { res, out };
}

const { res: r1, out: o1 } = mockRes();
contract({ method: 'GET', headers: {} }, r1);
console.log('contract ->', o1.statusCode, '| rutas:', o1.body?.routes?.length, '| uptime medido:', o1.body?.uptime?.measured);
if (o1.statusCode !== 200 || !Array.isArray(o1.body?.routes) || o1.body.routes.length < 4) {
  console.error('FALLA contract');
  process.exit(1);
}

const { res: r2, out: o2 } = mockRes();
await preview(
  { method: 'GET', url: '/v1/agent-check/preview?chain=8453&agent_id=356966', headers: { 'x-forwarded-for': '10.0.0.1' } },
  r2,
);
console.log('preview ->', o2.statusCode, '| veredicto:', o2.body?.verdict, '| banda:', o2.body?.score_band, '| flags:', o2.body?.flags);
if (o2.statusCode !== 200 || !o2.body?.verdict) {
  console.error('FALLA preview', JSON.stringify(o2.body).slice(0, 300));
  process.exit(1);
}
if ('score' in o2.body) {
  console.error('FALLA: el preview no debe traer el score exacto');
  process.exit(1);
}

const { res: r3, out: o3 } = mockRes();
await preview({ method: 'GET', url: '/v1/agent-check/preview?chain=abc&agent_id=x', headers: {} }, r3);
console.log('preview invalido ->', o3.statusCode);
if (o3.statusCode !== 400) { console.error('FALLA validacion'); process.exit(1); }

console.log('OK: las tres pruebas pasaron');
