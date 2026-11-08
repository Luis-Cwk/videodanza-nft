// Registra la herramienta ERC-8257 en el ToolRegistry de OpenSea.
// Carga PRIVATE_KEY y RPC_URL de .env sin imprimirlos nunca.
// Uso: node scripts/registrar-opensea.mjs [--dry-run]
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const MANIFIESTO =
  process.argv[2]?.startsWith('http')
    ? process.argv[2]
    : 'https://entropia.petrasynthetic.com/.well-known/ai-tool/entropia-agent-check.json';

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

const extra = process.argv.slice(2).filter((a) => !a.startsWith('http'));
const indiceId = extra.indexOf('--tool-id');
const toolId = indiceId >= 0 ? extra[indiceId + 1] : null;
const banderas = indiceId >= 0 ? extra.filter((_, n) => n !== indiceId && n !== indiceId + 1) : extra;

const comando = toolId ? 'update-metadata' : 'register';
const args = toolId
  ? ['@opensea/tool-sdk', comando, '--tool-id', toolId, '--metadata', MANIFIESTO, '--network', 'base', '-y', ...banderas]
  : ['@opensea/tool-sdk', comando, '--metadata', MANIFIESTO, '--network', 'base', '-y', ...banderas];

const r = spawnSync('npx', args, {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PRIVATE_KEY: env.PRIVATE_KEY,
      // El .env apunta a Sepolia; el registro va en Base mainnet.
      RPC_URL: env.BASE_RPC_URL || 'https://mainnet.base.org',
    },
  },
);
process.exit(r.status ?? 1);
