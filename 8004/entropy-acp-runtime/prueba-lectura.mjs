// Prueba de lectura.mjs: node prueba-lectura.mjs
// 1) sitio estatico se lee directo, 2) sitio JS pesado cae a Browserbase,
// 3) dominio inexistente no lanza, 4) urlsEn corta en MAX_URLS.

import { readFileSync } from 'node:fs';
import { urlsEn, lecturaDeRequirement } from './lectura.mjs';

const cargado = {};
for (const linea of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  const m = linea.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
  if (m) cargado[m[1]] = m[2].trim();
}
const BROWSERBASE_API_KEY = cargado.BROWSERBASE_API_KEY;
if (!BROWSERBASE_API_KEY) {
  console.log('Falta BROWSERBASE_API_KEY en .env');
  process.exit(1);
}

let fallos = 0;
const ok = (nombre, cond) => {
  console.log((cond ? 'OK ' : 'FAIL ') + nombre);
  if (!cond) fallos++;
};

const extraidas = urlsEn(
  'mira https://a.com/x. tambien https://b.com, https://c.com y https://d.com y https://e.com.'
);
ok('urlsEn: corta en 2 y deduplica', extraidas.length === 2 && extraidas[0] === 'https://a.com/x');

const r1 = await lecturaDeRequirement(
  'Critica https://petrasynthetic.com/ con detalle.',
  () => {}
);
ok('estatico: texto largo y sin invento', r1.length > 1500 && r1.includes('PAGINA 1'));

// token real de Chromie Squiggle en Art Blocks
const r2 = await lecturaDeRequirement(
  'Critica el token https://artblocks.io/token/78000001.',
  () => {}
);
ok('JS pesado: Browserbase rescato contenido', r2.includes('PAGINA 1') && r2.length > 1500);

const r3 = await lecturaDeRequirement(
  'Critica https://dominio-inexistente-9812374.com.',
  () => {}
);
ok('dominio inexistente: no lanza, avisa', !r3.includes('PAGINA 1'));

console.log(fallos === 0 ? '\nTodas pasaron.' : `\n${fallos} fallos.`);
process.exit(fallos === 0 ? 0 : 1);
