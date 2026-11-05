// Prueba de humo del MCP: lista de tools y llamada real a agent_check_preview.
import mcp from '../api/mcp.js';

function mockRes() {
  const out: any = { statusCode: 0, body: null };
  const res: any = {
    setHeader: () => {},
    status: (c: number) => { out.statusCode = c; return res; },
    json: (b: any) => { out.body = b; return res; },
    end: () => res,
  };
  return { res, out };
}

const { res: r1, out: o1 } = mockRes();
await mcp({ method: 'POST', body: { jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} } }, r1);
const names = (o1.body?.result?.tools || []).map((t: any) => t.name);
console.log('tools:', names.length, '|', names.join(', '));
for (const must of ['agent_check', 'agent_check_preview']) {
  if (!names.includes(must)) { console.error('FALLA: falta', must); process.exit(1); }
}

const { res: r2, out: o2 } = mockRes();
await mcp({
  method: 'POST',
  body: {
    jsonrpc: '2.0', id: 2, method: 'tools/call',
    params: { name: 'agent_check_preview', arguments: { chain: '8453', agent_id: '356966' } },
  },
}, r2);
const text = o2.body?.result?.content?.[0]?.text || '';
const parsed = JSON.parse(text);
console.log('preview via MCP ->', parsed.status, '| veredicto:', parsed.verdict, '| banda:', parsed.score_band);
if (parsed.status !== 200 || !parsed.verdict) { console.error('FALLA preview MCP'); process.exit(1); }
if ('score' in parsed) { console.error('FALLA: el preview no debe traer score exacto'); process.exit(1); }

console.log('OK: MCP expone las dos tools y el preview responde');
