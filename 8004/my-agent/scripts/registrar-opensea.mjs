// Registra la herramienta ERC-8257 en el ToolRegistry de OpenSea.
// Carga PRIVATE_KEY y RPC_URL de .env sin imprimirlos nunca.
// Uso: node scripts/registrar-opensea.mjs [--dry-run]
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const MANIFIESTO = 'https://entropia.petrasynthetic.com/.well-known/ai-tool/entropia-agent-check.json';

const env = {};
for (const linea of readFileSync('.env', 'utf8').split(/\r?\n/)) {
  if (!linea || linea.trim().startsWith('#')) continue;
  const corte = linea.indexOf('=');
  if (corte < 1) continue;
  env[linea.slice(0, corte).trim()] = linea.slice(corte + 1).trim().replace(/^["']|["']$/g, '');
}

if (!env.PRIVATE_KEY) {
  console.error('Falta PRIVATE_KEY en .env');
  process.exit(1);
}

const extra = process.argv.slice(2);
const r = spawnSync(
  'npx',
  ['@opensea/tool-sdk', 'register', '--metadata', MANIFIESTO, '--network', 'base', '-y', ...extra],
  {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PRIVATE_KEY: env.PRIVATE_KEY,
      RPC_URL: env.RPC_URL || 'https://mainnet.base.org',
    },
  },
);
process.exit(r.status ?? 1);
