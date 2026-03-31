/**
 * Test script for agent.ts functions
 * Run: npx tsx src/test-agent.ts
 */
import { generateComposition, generateNFTDescription, generateContract } from './agent.js';

console.log('========================================');
console.log('  TESTS: entropiav2 Agent Functions');
console.log('========================================\n');

// TEST 1: Composition generation
console.log('=== TEST 1: generateComposition ===');
const comp1 = generateComposition({ 
  mood: 'melancholic', 
  gender: 'she', 
  energy: 'high', 
  seed: 'cuerpo-que-baila-solo' 
});
console.log(JSON.stringify(comp1, null, 2));
console.log('✅ Composition generated\n');

// TEST 2: Determinism
console.log('=== TEST 2: Determinismo (misma semilla = mismo resultado) ===');
const comp2 = generateComposition({ 
  mood: 'melancholic', 
  gender: 'she', 
  energy: 'high', 
  seed: 'cuerpo-que-baila-solo' 
});
const same = JSON.stringify(comp1) === JSON.stringify(comp2);
console.log(same ? '✅ PASO: Mismo resultado con misma semilla' : '❌ FALLO: Resultados diferentes');
console.log('');

// TEST 3: Different seed = different result
console.log('=== TEST 3: Diferente semilla = diferente resultado ===');
const comp3 = generateComposition({ 
  mood: 'joyful', 
  gender: 'he', 
  seed: 'otra-semilla' 
});
const different = JSON.stringify(comp1) !== JSON.stringify(comp3);
console.log(different ? '✅ PASO: Resultados diferentes' : '❌ FALLO: Mismo resultado');
console.log(JSON.stringify(comp3, null, 2));
console.log('');

// TEST 4: NFT Description
console.log('=== TEST 4: generateNFTDescription ===');
const desc = generateNFTDescription(comp1, 42);
console.log(desc);
console.log('\n✅ Description generated\n');

// TEST 5: Contract generation
console.log('=== TEST 5: generateContract (dynamic_nft) ===');
const contract = generateContract('dynamic_nft', { name: 'VideoDanzaNFT' });
const checks = [
  { name: 'Longitud OK', pass: contract.length > 500 },
  { name: 'Nombre reemplazado', pass: contract.includes('VideoDanzaNFT') },
  { name: 'Tiene evolve()', pass: contract.includes('evolve') },
  { name: 'Tiene userSeed', pass: contract.includes('userSeed') },
  { name: 'Tiene estados', pass: contract.includes('Seed') },
  { name: 'OpenZeppelin imports', pass: contract.includes('@openzeppelin') },
];
checks.forEach(c => console.log(c.pass ? `✅ ${c.name}` : `❌ ${c.name}`));
console.log(`\nContrato: ${contract.length} caracteres`);
console.log('');

// TEST 6: Standard NFT contract
console.log('=== TEST 6: generateContract (nft) ===');
const nftContract = generateContract('nft', { name: 'MiColeccion' });
const nftChecks = [
  { name: 'Longitud OK', pass: nftContract.length > 500 },
  { name: 'Nombre reemplazado', pass: nftContract.includes('MiColeccion') },
  { name: 'Tiene mint()', pass: nftContract.includes('mint') },
  { name: 'Tiene tokenData', pass: nftContract.includes('TokenData') },
];
nftChecks.forEach(c => console.log(c.pass ? `✅ ${c.name}` : `❌ ${c.name}`));
console.log('');

// TEST 7: All gender pools work
console.log('=== TEST 7: Todos los pools de genero funcionan ===');
const genders = ['he', 'she', 'hybrid', 'avatar'] as const;
genders.forEach(g => {
  const c = generateComposition({ gender: g, seed: `test-${g}` });
  console.log(`${g}: ${c.videoIds.length} videos seleccionados ✅`);
});

console.log('\n========================================');
console.log('  TODOS LOS TESTS COMPLETADOS');
console.log('========================================');
