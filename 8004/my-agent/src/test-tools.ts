/**
 * Test script for tools.ts
 * Run: npx tsx src/test-tools.ts
 */
import { tools, handleToolCall } from './tools.js';

console.log('========================================');
console.log('  TESTS: entropiav2 MCP Tools');
console.log('========================================\n');

// TEST 1: Tools list
console.log('=== TEST 1: Herramientas registradas ===');
console.log(`Total: ${tools.length} herramientas`);
tools.forEach((t, i) => console.log(`  ${i + 1}. ${t.name} - ${t.description.slice(0, 60)}...`));
console.log('');

// TEST 2: generate_composition tool
console.log('=== TEST 2: generate_composition ===');
const compResult = await handleToolCall('generate_composition', {
  mood: 'melancholic',
  gender: 'she',
  energy: 'high',
  seed: 'cuerpo-que-baila-solo',
}) as any;
console.log('message:', compResult.message);
console.log('seed:', compResult.composition.seed);
console.log('videos:', compResult.composition.videoIds);
console.log('blend:', compResult.composition.blendMode);
console.log('✅ generate_composition funciona\n');

// TEST 3: generate_contract tool
console.log('=== TEST 3: generate_contract (dynamic_nft) ===');
const contractResult = await handleToolCall('generate_contract', {
  type: 'dynamic_nft',
  name: 'VideoDanzaNFT',
}) as any;
console.log('type:', contractResult.contractType);
console.log('name:', contractResult.name);
console.log('code length:', contractResult.code.length, 'chars');
console.log('✅ generate_contract funciona\n');

// TEST 4: generate_contract (nft)
console.log('=== TEST 4: generate_contract (nft) ===');
const nftResult = await handleToolCall('generate_contract', {
  type: 'nft',
  name: 'MiColeccion',
}) as any;
console.log('code length:', nftResult.code.length, 'chars');
console.log('✅ generate_contract (nft) funciona\n');

// TEST 5: generate_contract (invalid type)
console.log('=== TEST 5: generate_contract (tipo invalido) ===');
const invalidResult = await handleToolCall('generate_contract', {
  type: 'invalid_type',
  name: 'Test',
}) as any;
console.log(invalidResult.error ? '✅ Maneja error correctamente' : '❌ No maneja error');
console.log('');

// TEST 6: describe_nft tool
console.log('=== TEST 6: describe_nft ===');
const descResult = await handleToolCall('describe_nft', {
  seed: 'abc123def456',
  token_id: 7,
  video_count: 3,
  music_track: 4,
  blend_mode: 'overlay',
}) as any;
console.log('tokenId:', descResult.tokenId);
console.log('description preview:', descResult.description.slice(0, 100) + '...');
console.log('✅ describe_nft funciona\n');

// TEST 7: get_agent_info tool
console.log('=== TEST 7: get_agent_info ===');
const infoResult = await handleToolCall('get_agent_info', {}) as any;
console.log('name:', infoResult.name);
console.log('version:', infoResult.version);
console.log('capabilities:', infoResult.capabilities.length);
console.log('projects:', infoResult.projects.length);
console.log('✅ get_agent_info funciona\n');

// TEST 8: Unknown tool error
console.log('=== TEST 8: Herramienta desconocida ===');
try {
  await handleToolCall('nonexistent_tool', {});
  console.log('❌ No lanzo error');
} catch (e: any) {
  console.log(e.message.includes('nonexistent_tool') ? '✅ Lanza error correcto' : '❌ Error inesperado');
}
console.log('');

console.log('========================================');
console.log('  TODOS LOS TESTS COMPLETADOS');
console.log('========================================');
