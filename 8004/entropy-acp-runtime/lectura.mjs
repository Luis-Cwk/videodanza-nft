// Lectura de paginas para los jobs de critica: extrae las URLs del requirement,
// baja cada una con fetch directo y, si vuelve poco texto, reintenta con Browserbase
// Fetch en markdown (plan gratis: 1.000 fetch, sin necesidad de Playwright).
// shortcut: MIN_TEXTO fijo; si el fallback se dispara en casi todas las paginas,
// revisar que sitios se cuelan y ajustar el umbral.

const MAX_URLS = 2;
const MIN_TEXTO = 600;
const TIMEOUT_MS = 15000;

export function urlsEn(texto) {
  const unicas = [];
  for (const m of String(texto).matchAll(/https?:\/\/[^\s<>"')\]]+/g)) {
    const u = m[0].replace(/[.,;:]+$/, '');
    if (!unicas.includes(u)) unicas.push(u);
    if (unicas.length === MAX_URLS) break;
  }
  return unicas;
}

function htmlATexto(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function conLimite(url, opciones) {
  const controlador = new AbortController();
  const t = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...opciones, signal: controlador.signal });
  } finally {
    clearTimeout(t);
  }
}

async function fetchDirecto(url) {
  const r = await conLimite(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; entropy-art-agent/1.0)' },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const tipo = r.headers.get('content-type') ?? '';
  const cuerpo = await r.text();
  return tipo.includes('html') ? htmlATexto(cuerpo) : cuerpo.slice(0, 20000);
}

async function conBrowserbase(url) {
  const key = process.env.BROWSERBASE_API_KEY;
  if (!key) return '';
  const r = await conLimite('https://api.browserbase.com/v1/fetch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-BB-API-Key': key },
    body: JSON.stringify({ url, format: 'markdown', allowRedirects: true }),
  });
  if (!r.ok) throw new Error(`Browserbase HTTP ${r.status}`);
  const j = await r.json();
  if (j.statusCode !== 200) throw new Error(`Sitio HTTP ${j.statusCode}`);
  return typeof j.content === 'string' ? j.content : '';
}

async function lecturaDeUrl(url, log) {
  let texto = '';
  try {
    texto = await fetchDirecto(url);
    log(`lectura: fetch directo ${url} -> ${texto.length} chars`);
  } catch (error) {
    log(`lectura: fetch directo ${url} fallo (${error.message})`);
  }
  if (texto.length < MIN_TEXTO) {
    try {
      texto = await conBrowserbase(url);
      log(`lectura: Browserbase ${url} -> ${texto.length} chars`);
    } catch (error) {
      log(`lectura: Browserbase ${url} fallo (${error.message})`);
    }
  }
  return texto;
}

// Devuelve el requirement con el texto de las paginas agregado; nunca lanza.
export async function lecturaDeRequirement(requirement, log = () => {}) {
  const urls = urlsEn(requirement);
  if (urls.length === 0) return String(requirement);
  const partes = [];
  for (let i = 0; i < urls.length; i++) {
    const texto = await lecturaDeUrl(urls[i], log);
    if (texto) partes.push(`PAGINA ${i + 1}: ${urls[i]}\n${texto.slice(0, 12000)}`);
  }
  if (partes.length === 0) {
    log('lectura: ninguna pagina dio texto, se critica solo con el brief.');
    return String(requirement);
  }
  return `${requirement}\n\n=== TEXTO LEIDO DE LAS PAGINAS ===\nUsa este contenido real; no lo inventes:\n\n${partes.join('\n\n')}`;
}
