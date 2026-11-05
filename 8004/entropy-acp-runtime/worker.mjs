import { execFile } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
loadEnvFile(join(ROOT, '.env'));
loadEnvFile(join(ROOT, '..', 'my-agent', '.env'));

const LOG_FILE = join(ROOT, 'runtime.log');
const CHAIN_ID = process.env.ACP_CHAIN_ID ?? '8453';
const ACP_SCRIPT =
  process.env.ACP_CLI_SCRIPT ??
  'C:/Program Files/nodejs/node_modules/@virtuals-protocol/acp-cli/dist/bin/acp.js';
const LLM_PROVIDER = String(process.env.LLM_PROVIDER ?? 'groq').toLowerCase();
const DEFAULT_LLM_MODEL = LLM_PROVIDER === 'groq' ? 'openai/gpt-oss-120b' : 'meta/llama-3.2-90b-vision-instruct';
const LLM_MODEL = process.env.ACP_LLM_MODEL ?? DEFAULT_LLM_MODEL;
const LLM_TIMEOUT_MS = Number(process.env.ACP_LLM_TIMEOUT_MS ?? 180000);
const SELFTEST = process.argv.includes('--selftest');
const EXPECTED_WALLET = (process.env.ACP_AGENT_WALLET ?? '0x2200cdf7512833a9b37ef5ac136f135398c0045c').toLowerCase();
const POLL_MS = Number(process.env.ACP_POLL_MS ?? 5000);
const FALLBACK_PRICE = process.env.ACP_FALLBACK_PRICE ?? '0';
const TEST_JOB_IDS = new Set(
  (process.env.ACP_TEST_JOB_IDS ?? '82136')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
);
const ONCE = process.argv.includes('--once');

// shortcut: precios fijos; si cambian las ofertas, actualizar este mapa.
const OFFERINGS = new Map([
  ['art_metadata_composition', { priceType: 'fixed', priceValue: 5 }],
  ['generative_videodance_composition', { priceType: 'fixed', priceValue: 10 }],
  ['genlayer_escrow_review', { priceType: 'fixed', priceValue: 25 }],
  ['quick_art_critique', { priceType: 'fixed', priceValue: 1 }],
  ['first_critique_free', { priceType: 'fixed', priceValue: 0.01 }]
]);

mkdirSync(ROOT, { recursive: true });

function loadEnvFile(file) {
  if (!existsSync(file)) return;
  const lines = readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, raw] = match;
    if (process.env[key] !== undefined) continue;
    let value = raw.trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}`;
  console.log(line);
  appendFileSync(LOG_FILE, `${line}\n`);
}

function runAcp(args) {
  return new Promise((resolve, reject) => {
    // timeout de 60s: si la CLI se cuelga (API de Virtuals caida), el ciclo sigue.
    execFile(
      process.execPath,
      [ACP_SCRIPT, ...args],
      { windowsHide: true, timeout: 60000, killSignal: 'SIGKILL', maxBuffer: 20 * 1024 * 1024 },
      (error, stdout, stderr) => {
        const output = `${stdout ?? ''}\n${stderr ?? ''}`.trim();
        if (error) {
          const failure = new Error(`acp ${args.join(' ')} falló: ${error.message}`);
          failure.output = output;
          reject(failure);
          return;
        }
        resolve(output);
      }
    );
  });
}

function parseJson(output) {
  const text = output.trim();
  try {
    return JSON.parse(text);
  } catch {
    // La CLI puede escribir avisos antes del JSON.
  }
  const lines = text.split(/\r?\n/).reverse();
  for (const line of lines) {
    try {
      return JSON.parse(line);
    } catch {
      // Siguiente línea.
    }
  }
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(text.slice(start, end + 1));
  }
  throw new Error(`La CLI no devolvió JSON: ${text.slice(0, 500)}`);
}

function getRequirement(history) {
  const entry = (history.entries ?? []).find(
    (item) => item.kind === 'message' && item.contentType === 'requirement'
  );
  if (!entry?.content) return '';
  try {
    return JSON.parse(entry.content);
  } catch {
    return entry.content;
  }
}

function inferOffering(requirement) {
  const text = String(requirement).toLowerCase();
  if (/free/.test(text) && /critique|cr[ií]tica/.test(text)) return 'first_critique_free';
  if (/escrow|genlayer|settle|dispute/.test(text)) return 'genlayer_escrow_review';
  if (/metadata|curatorial|title|tags/.test(text)) return 'art_metadata_composition';
  if (/videodance|choreograph|composition|movement|palette/.test(text)) {
    return 'generative_videodance_composition';
  }
  if (/critique|cr[ií]tica|feedback|review/.test(text)) return 'quick_art_critique';
  return null;
}

async function loadHistory(jobId) {
  return parseJson(await runAcp(['job', 'history', '--job-id', jobId, '--chain-id', CHAIN_ID, '--json']));
}

function resolveBudget(job, offerings, requirement) {
  const jobId = String(job.onChainJobId ?? job.jobId);
  if (TEST_JOB_IDS.has(jobId) || /runtimetest/.test(String(requirement).replace(/\s+/g, '').toLowerCase())) {
    return '0';
  }

  const offeringName = job.offeringName ?? job.offering?.name ?? inferOffering(requirement);
  const offering = offeringName ? offerings.get(offeringName) : undefined;
  if (offering && offering.priceType === 'fixed') {
    const price = Number(offering.priceValue);
    if (/petra20/i.test(String(requirement)) && price > 0) {
      const discounted = Math.max(0.01, Number((price * 0.8).toFixed(2)));
      log(`Job ${jobId}: descuento PETRA20 aplicado, ${price} -> ${discounted} USDC.`);
      return String(discounted);
    }
    return String(offering.priceValue);
  }
  if (offering && offering.priceType === 'percentage') {
    log(`Job ${jobId}: la oferta ${offeringName} usa porcentaje, no se puede calcular sin capital.`);
    return null;
  }

  log(`Job ${jobId}: no se pudo identificar la oferta, se usa precio de respaldo ${FALLBACK_PRICE}.`);
  return FALLBACK_PRICE;
}

function makeFallbackDeliverable(job, service) {
  const jobId = String(job.onChainJobId ?? job.jobId);

  if (service === 'art_metadata_composition') {
    return JSON.stringify({
      service,
      job_id: jobId,
      title: 'Untitled composition',
      description: 'Metadata draft generated by Entropy for the supplied artwork brief.',
      tags: ['generative art', 'videodance', 'onchain'],
      curatorial_note:
        'The work treats the body as a signal source: movement becomes data, and the data returns as image. The piece should be read as a loop between flesh and computation, not as a portrait.',
      status: 'draft'
    });
  }

  if (service === 'generative_videodance_composition') {
    const seed = `${jobId}:${job.clientAddress}:entropy`;
    return JSON.stringify({
      service,
      job_id: jobId,
      seed,
      duration_seconds: 20,
      palette: ['#0B0B0F', '#7A5CFF', '#B6FF3B', '#F2E9E4'],
      camera: 'slow orbit, 24 mm, slight handheld drift',
      choreography: 'three bodies, contact improvisation, one repeated fall and recovery',
      audio: 'low sine drone, granular breath, 48 BPM',
      preview_url: 'https://petrasynthetic.com/',
      status: 'draft'
    });
  }

  if (service === 'genlayer_escrow_review') {
    return [
      '# GenLayer escrow review',
      '',
      `Job: ${jobId}`,
      '',
      '## Assumptions',
      '- Two parties, client and provider, with a neutral evaluator.',
      '- The deliverable is judged against the brief before settlement.',
      '',
      '## State machine',
      'open -> budget_set -> funded -> submitted -> completed',
      'Any state before submitted can expire. Submitted can be rejected and returned to the client.',
      '',
      '## Risks',
      '- Missing timeout per state, so funds can stay locked indefinitely.',
      '- Evaluator can be the client, which weakens neutrality.',
      '- No explicit hash of the brief, so the deliverable can drift from the request.',
      '',
      '## Missing states',
      '- Disputed, with a bounded review window.',
      '- Cancelled before funding.',
      '',
      '## Test checklist',
      '- Fund, submit, complete, verify the provider balance.',
      '- Reject, verify the client refund.',
      '- Expire before funding, verify no movement.',
      '- Submit after the SLA, verify the contract rejects or flags it.'
    ].join('\n');
  }

  if (service === 'quick_art_critique' || service === 'first_critique_free') {
    return JSON.stringify({
      service,
      job_id: jobId,
      summary:
        'Critica breve generada por Entropy. El modelo no estaba disponible, asi que esta es una estructura para completar con la obra.',
      strengths: ['La obra tiene una intencion clara.', 'El cuerpo aparece como material, no como decoracion.'],
      risks: ['Falta contexto de exhibicion o destino de la pieza.', 'El titulo y la descripcion pueden precisar mas concrecion.'],
      next_step: 'Definir el formato final y el publico antes de cerrar la edicion.',
      status: 'draft'
    });
  }

  return JSON.stringify({
    service,
    job_id: jobId,
    agent: 'Entropy',
    status: 'ok',
    message: 'ACP provider runtime connected and processed the job.',
    note: 'Custom job handled by the deterministic v0 runtime.'
  });
}

const SYSTEM_PROMPT = [
  'Eres Entropy, agente creativo de Petra (Luis Betancourt), artista multidisciplinario de Ciudad de Mexico.',
  'Trabajas con videodanza generativa, arte onchain y cuerpos.',
  'Escribes en el idioma del brief. Eres concreto y no adulador.',
  'No inventes creditos, fechas ni datos verificables. No atribuyas la obra a Petra; habla de la obra.',
  'Usa lenguaje neutro: no escribas "el artista" ni "la artista".',
  'Devuelve exactamente el formato pedido, sin texto extra.'
].join(' ');

function briefText(requirement) {
  if (typeof requirement === 'string') return requirement.trim();
  try {
    return JSON.stringify(requirement, null, 2);
  } catch {
    return String(requirement);
  }
}

function buildPrompt(service, job, requirement) {
  const jobId = String(job.onChainJobId ?? job.jobId);
  const brief = briefText(requirement) || 'Sin brief adicional.';
  const jsonRule = 'Devuelve solo JSON valido, sin markdown ni explicaciones.';

  if (service === 'art_metadata_composition') {
    return {
      json: true,
      system: SYSTEM_PROMPT,
      user: `Genera la metadata de esta obra para un NFT.\n\nBrief:\n${brief}\n\n${jsonRule}\nForma exacta:\n{"title":"...","description":"...","tags":["...","...","..."],"curatorial_note":"...","status":"draft"}\nLa description debe tener entre 40 y 80 palabras. La curatorial_note entre 60 y 120 palabras. Los tags deben ser 3 a 6, en minusculas y sin almohadilla.`
    };
  }

  if (service === 'generative_videodance_composition') {
    const seed = `${jobId}:${job.clientAddress}:entropy`;
    return {
      json: true,
      system: SYSTEM_PROMPT,
      user: `Disena una composicion de videodanza generativa a partir del brief.\n\nBrief:\n${brief}\n\n${jsonRule}\nLa semilla es obligatoria y debe ser exactamente "${seed}".\nForma exacta:\n{"seed":"...","duration_seconds":20,"palette":["#111111","#222222","#333333","#444444"],"camera":"...","choreography":"...","audio":"...","preview_url":"https://petrasynthetic.com/","status":"draft"}\nLa duracion debe ser un numero entre 10 y 60. La paleta debe tener 4 colores hex. camera, choreography y audio deben ser frases concretas, no listas de adjetivos.`
    };
  }

  if (service === 'genlayer_escrow_review') {
    return {
      json: false,
      system: SYSTEM_PROMPT,
      user: `Escribe una revision tecnica del flujo de escrow descrito en el brief.\n\nBrief:\n${brief}\n\nDevuelve markdown con estas secciones exactas:\n# GenLayer escrow review\n## Assumptions\n## State machine\n## Risks\n## Missing states\n## Test checklist\n\nSe concreto: estados, transiciones, condiciones de liquidacion, casos borde y pruebas. No repitas el brief. Maximo 700 palabras.`
    };
  }

  if (service === 'quick_art_critique' || service === 'first_critique_free') {
    return {
      json: true,
      system: SYSTEM_PROMPT,
      user: `Escribe una critica breve y concreta de la obra descrita en el brief.\n\nBrief:\n${brief}\n\n${jsonRule}\nForma exacta:\n{"summary":"...","strengths":["...","...","..."],"risks":["...","...","..."],"next_step":"...","status":"draft"}\nEl summary debe tener entre 60 y 120 palabras. strengths y risks deben tener 3 elementos cada uno. next_step debe ser una accion concreta.`
    };
  }

  return {
    json: false,
    system: SYSTEM_PROMPT,
    user: `Responde al siguiente brief con un entregable claro y concreto en markdown.\n\nBrief:\n${brief}\n\nMaximo 500 palabras.`
  };
}

async function callLlm(system, user) {
  const provider = LLM_PROVIDER;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

  try {
    if (provider === 'groq') {
      const apiKey = process.env.GROQ_API_KEY;
      if (!apiKey) throw new Error('GROQ_API_KEY no esta configurada');

      const response = await fetch(process.env.GROQ_URL ?? 'https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.7,
          max_tokens: 1200
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Groq ${response.status}: ${(await response.text()).slice(0, 300)}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Groq no devolvio contenido');
      return content;
    }

    if (provider === 'ollama') {
      const response = await fetch(process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          stream: false,
          options: { temperature: 0.7, num_predict: 1200 }
        }),
        signal: controller.signal
      });
      if (!response.ok) {
        throw new Error(`Ollama ${response.status}: ${(await response.text()).slice(0, 300)}`);
      }
      const data = await response.json();
      const content = data.message?.content;
      if (!content) throw new Error('Ollama no devolvio contenido');
      return content;
    }

    if (provider !== 'nvidia') {
      throw new Error(`Proveedor LLM no soportado: ${provider}`);
    }

    const apiKey = process.env.NVIDIA_API;
    if (!apiKey) throw new Error('NVIDIA_API no esta configurada');

    const response = await fetch(
      process.env.NVIDIA_URL ?? 'https://integrate.api.nvidia.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: LLM_MODEL,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.7,
          max_tokens: 1200
        }),
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(`LLM ${response.status}: ${(await response.text()).slice(0, 300)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('El LLM no devolvio contenido');
    return content;
  } finally {
    clearTimeout(timer);
  }
}

function parseJsonLoose(text) {
  const cleaned = text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Puede venir con texto antes o despues del bloque JSON.
  }
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start >= 0 && end > start) {
    return JSON.parse(cleaned.slice(start, end + 1));
  }
  throw new Error('La respuesta del LLM no es JSON');
}

async function generateDeliverable(job, service, requirement) {
  const jobId = String(job.onChainJobId ?? job.jobId);
  const prompt = buildPrompt(service, job, requirement);
  try {
    const content = await callLlm(prompt.system, prompt.user);
    if (!prompt.json) return content.trim();
    const parsed = parseJsonLoose(content);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('El LLM no devolvio un objeto JSON');
    }
    return JSON.stringify({ ...parsed, service, job_id: jobId, status: parsed.status ?? 'draft' });
  } catch (error) {
    log(`Job ${jobId}: LLM fallo (${error.message}); se usa la plantilla determinista.`);
    return makeFallbackDeliverable(job, service);
  }
}

import { lecturaDeRequirement } from './lectura.mjs';

async function handleJob(job, offerings) {
  const jobId = String(job.onChainJobId ?? job.jobId);
  const provider = String(job.providerAddress ?? '').toLowerCase();
  if (provider !== EXPECTED_WALLET) return;

  const status = String(job.jobStatus ?? job.status ?? '').toUpperCase();
  const history = await loadHistory(jobId);
  const requirement = getRequirement(history);
  const service = job.offeringName ?? job.offering?.name ?? inferOffering(requirement) ?? 'custom';

  if (status === 'OPEN') {
    const budget = resolveBudget(job, offerings, requirement);
    if (budget === null) return;
    log(`Job ${jobId}: proponiendo presupuesto ${budget} USDC.`);
    let result;
    try {
      result = parseJson(
        await runAcp(['provider', 'set-budget', '--job-id', jobId, '--amount', budget, '--chain-id', CHAIN_ID, '--json'])
      );
    } catch (error) {
      const detail = String(error.output ?? error.message);
      if (!/FundTransferHook|setBudgetWithFundRequest/i.test(detail)) throw error;
      log(`Job ${jobId}: la oferta usa FundTransferHook, se usa set-budget-with-fund-request.`);
      result = parseJson(
        await runAcp([
          'provider',
          'set-budget-with-fund-request',
          '--job-id',
          jobId,
          '--amount',
          budget,
          '--transfer-amount',
          '0',
          '--destination',
          EXPECTED_WALLET,
          '--chain-id',
          CHAIN_ID,
          '--json'
        ])
      );
    }
    log(`Job ${jobId}: presupuesto aceptado ${JSON.stringify(result)}.`);
    return;
  }

  if (status === 'FUNDED') {
    let requirementParaLlm = requirement;
    if (/critique/i.test(service)) {
      requirementParaLlm = await lecturaDeRequirement(requirement, log);
    }
    const deliverable = await generateDeliverable(job, service, requirementParaLlm);
    log(`Job ${jobId}: entregando resultado.`);
    const result = parseJson(
      await runAcp([
        'provider',
        'submit',
        '--job-id',
        jobId,
        '--deliverable',
        deliverable,
        '--chain-id',
        CHAIN_ID,
        '--json'
      ])
    );
    log(`Job ${jobId}: entregado ${JSON.stringify(result)}.`);
  }
}

async function main() {
  const whoami = parseJson(await runAcp(['agent', 'whoami', '--json']));
  const wallet = String(whoami.walletAddress ?? '').toLowerCase();
  if (wallet !== EXPECTED_WALLET) {
    throw new Error(
      `El agente activo es ${whoami.name} (${wallet}), no Entropy (${EXPECTED_WALLET}). Ejecuta acp agent use --agent-id 01a16777-0f37-71d6-b2af-ebc5d6019abf.`
    );
  }

  log(`Runtime de ${whoami.name} iniciado en chain ${CHAIN_ID}.`);
  const offerings = OFFERINGS;

  do {
    try {
      const jobs = parseJson(await runAcp(['job', 'list', '--json'])).jobs ?? [];
      for (const job of jobs) {
        try {
          await handleJob(job, offerings);
        } catch (error) {
          log(`Job ${job.onChainJobId ?? job.jobId}: error ${error.message}`);
          if (error.output) log(error.output.slice(-1200));
        }
      }
    } catch (error) {
      log(`Error en el ciclo: ${error.message}`);
      if (error.output) log(error.output.slice(-1200));
    }
    if (!ONCE) await new Promise((resolve) => setTimeout(resolve, POLL_MS));
  } while (!ONCE);

  log('Runtime detenido.');
}

async function runSelftest() {
  const sample = {
    title: 'Cuerpo que cae',
    medium: 'video 16:9, 20 segundos',
    themes: 'memoria, caida, loop, cuerpo como senal',
    tone: 'sobrio, intimo'
  };
  const job = {
    onChainJobId: 'selftest',
    clientAddress: '0x0000000000000000000000000000000000000000'
  };
  const services = [
    'art_metadata_composition',
    'generative_videodance_composition',
    'genlayer_escrow_review',
    'quick_art_critique',
    'first_critique_free'
  ];
  for (const service of services) {
    const result = await generateDeliverable(job, service, sample);
    console.log(`\n=== ${service} ===\n${result}\n`);
  }
}

if (SELFTEST) {
  runSelftest().catch((error) => {
    log(`Fallo el selftest: ${error.message}`);
    process.exitCode = 1;
  });
} else {
  main().catch((error) => {
    log(`Fallo fatal: ${error.message}`);
    process.exitCode = 1;
  });
}
