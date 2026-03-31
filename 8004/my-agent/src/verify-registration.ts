/**
 * Pre-registration verification
 * Run: npx tsx src/verify-registration.ts
 */
import 'dotenv/config';
import { tools } from './tools.js';
import { generateComposition, generateContract } from './agent.js';
import card from '../.well-known/agent-card.json' with { type: 'json' };

console.log('=== VERIFICACION PRE-REGISTRO ===\n');

console.log('1. Herramientas MCP:', tools.length, 'registradas');
tools.forEach(t => console.log('   -', t.name));

console.log('\n2. Motor de composiciones:');
const c = generateComposition({ mood: 'melancholic', gender: 'she', seed: 'test' });
console.log('   Seed:', c.seed, '| Videos:', c.videoIds.length, '| Blend:', c.blendMode);

console.log('\n3. Templates de contratos:');
['nft', 'dynamic_nft', 'token', 'marketplace', 'dao'].forEach(t => {
  const code = generateContract(t, { name: 'Test' });
  console.log('   -', t + ':', code.length > 100 ? 'OK' : 'FALLO');
});

console.log('\n4. Agent Card:');
console.log('   Name:', card.name);
console.log('   Version:', card.version);
console.log('   Skills:', card.skills.length);
card.skills.forEach((s: any) => console.log('   -', s.id));

console.log('\n5. Variables de entorno:');
console.log('   PRIVATE_KEY:', process.env.PRIVATE_KEY ? 'OK' : 'FALTANTE');
console.log('   PINATA_JWT:', process.env.PINATA_JWT ? 'OK' : 'FALTANTE');
console.log('   RPC_URL:', process.env.RPC_URL || 'default');
console.log('   LLM_PROVIDER:', process.env.LLM_PROVIDER || 'ollama');

console.log('\n=== LISTO PARA REGISTRO ===');
console.log('\nSiguientes pasos:');
console.log('1. Deploy en Railway');
console.log('2. Obtener URL publica');
console.log('3. Ejecutar: npm run register');
