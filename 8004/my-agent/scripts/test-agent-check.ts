/**
 * Prueba de la funcion pura de verdict. Correr: npx tsx scripts/test-agent-check.ts
 */
import assert from 'node:assert/strict';
import { scoreAgent } from '../src/agent-check.js';

const base = {
  name: 'demo',
  owner_address: '0xowner',
  agent_wallet: '0xwallet',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  metadata_completeness_score: 94,
  total_feedbacks: 7,
  average_score: 99,
  total_validations: 0,
  rank: 100,
  total_score: 70,
  x402_supported: true,
  services: { a2a: { endpoint: 'https://a/a2a' }, mcp: { endpoint: 'https://a/mcp' } },
  health_status: {
    services: { a2a: { status: 'healthy' }, mcp: { status: 'healthy' } },
    agent_wallet: { status: 'healthy' },
  },
  scores: { leaderboard_policy: { evidence_tier: 'established' } },
};

// 1. Agente sano con cobro: usable, score alto.
const healthy = scoreAgent(base, 8453, '1');
assert.equal(healthy.verdict, 'usable');
assert.equal(healthy.score, 100);
assert.equal(healthy.services.healthy, 2);

// 2. Agente muerto: inactivo, sin servicios, sin feedback.
const dead = scoreAgent(
  { ...base, is_active: false, services: {}, total_feedbacks: 0, average_score: 0, x402_supported: false },
  8453,
  '2'
);
assert.equal(dead.verdict, 'avoid');
assert.equal(dead.score, 15);
assert.deepEqual(dead.flags.filter((f) => f.severity === 'blocker').map((f) => f.code).sort(), ['inactive', 'no_services']);

// 3. Servicio caido, metadata floja, feedback sin puntuar, wallet sin probar.
const shaky = scoreAgent(
  {
    ...base,
    metadata_completeness_score: 40,
    average_score: 0,
    x402_supported: false,
    services: { mcp: { endpoint: 'https://a/mcp' } },
    health_status: {
      services: { mcp: { status: 'unhealthy' } },
      agent_wallet: { status: 'unhealthy' },
    },
  },
  8453,
  '3'
);
assert.equal(shaky.verdict, 'caution');
assert.equal(shaky.score, 45);
assert.ok(shaky.flags.some((f) => f.code === 'service_down'));
assert.ok(shaky.flags.some((f) => f.code === 'unscored_feedback'));

// 4. Respuesta invalida de upstream: no inventar verdict.
assert.throws(() => scoreAgent({ detail: 'Not Found' }, 8453, '4'));

console.log('ok: 4 casos');
