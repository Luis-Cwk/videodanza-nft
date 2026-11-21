/**
 * Pedido de secuencia de video - entropiav2
 *
 * Entra un pedido, sale el entregable listo para pegar en el canal privado de
 * Discord: los tres prompts con su frame de empalme, el negativo, las
 * instrucciones de render y la linea de condiciones.
 *
 * El render lo hace Petra en su cuenta. Este script no genera video, no cobra y
 * no toca la red: solo valida, arma y deja registro.
 *
 * Uso:
 *   npx tsx scripts/video-order.mts pedido.json
 *   npx tsx scripts/video-order.mts ficha.txt
 *   npx tsx scripts/video-order.mts --brief "un cuerpo que aprende a caer" --aspect 9:16 --cliente "@alguien"
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  construirSecuencia,
  dudasDelPedido,
  PRODUCTO,
  revisarBrief,
  type Aspecto,
} from '../src/video-prompts.js';

interface Pedido {
  cliente: string;
  brief: string;
  aspect?: Aspecto;
  uso?: string;
  evitar?: string;
  personas_reales?: boolean;
  marcas_o_personajes?: boolean;
  estado_pago?: string;
}

const SALIDA = process.env.PEDIDOS_DIR || 'C:/Users/petra/agentex/documentos/entropia/video-pedidos';

function args(): Record<string, string> {
  const out: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const clave = a.slice(2);
      const siguiente = argv[i + 1];
      if (siguiente && !siguiente.startsWith('--')) {
        out[clave] = siguiente;
        i += 1;
      } else {
        out[clave] = 'true';
      }
    }
  }
  return out;
}

function esSi(v: string | undefined): boolean {
  return /^\s*(s[ií]\b|si,|yes|true|claro|correcto)/i.test(String(v || ''));
}

/**
 * Lee la ficha pegada de Discord: siete respuestas numeradas. Tolera lineas
 * partidas y viñetas. Si no hay numeros, toma todo como brief y avisa.
 */
export function parsearFicha(texto: string): { pedido: Pedido; numerada: boolean } {
  const campos: Record<string, string> = {};
  let actual = '';
  for (const linea of texto.split(/\r?\n/)) {
    const m = linea.match(/^\s*(\d)\s*[.)-]\s*(.+)$/);
    if (m) {
      actual = m[1];
      campos[actual] = m[2].trim();
    } else if (actual && linea.trim()) {
      campos[actual] = `${campos[actual]} ${linea.trim()}`.trim();
    }
  }

  if (!Object.keys(campos).length) {
    return {
      numerada: false,
      pedido: { cliente: 'sin identificar', brief: texto.trim() },
    };
  }

  const limpiar = (s: string) => String(s || '').replace(/[.;,:\s]+$/, '').trim();
  const quitarVerbo = (s: string) =>
    s.replace(/^(quiero|quisiera|me gustaria|me gustaría|necesito|busco|hazme|haz|crea|genera|arma)\b[\s,]*/i, '');

  const quePasa = quitarVerbo(limpiar(campos['1'] || ''));
  const quien = quitarVerbo(limpiar(campos['2'] || ''));
  const formato = campos['3'] || '';
  const uso = limpiar(campos['4'] || '');
  const evitar = limpiar(campos['7'] || '');
  const brief = [quePasa, quien].filter(Boolean).join('. ');

  return {
    numerada: true,
    pedido: {
      cliente: 'sin identificar',
      brief,
      aspect: /9\s*[:x]\s*16|vertical/i.test(formato) ? '9:16' : '16:9',
      uso,
      evitar,
      personas_reales: esSi(campos['5']),
      marcas_o_personajes: esSi(campos['6']),
      estado_pago: 'pendiente',
    },
  };
}

function leerPedido(): { pedido: Pedido; aviso?: string } {
  const a = args();
  const argv = process.argv.slice(2);
  const archivo = argv.find((x) => !x.startsWith('--') && !argv[argv.indexOf(x) - 1]?.startsWith('--'));

  if (archivo && existsSync(archivo)) {
    const crudo = readFileSync(archivo, 'utf8');
    if (/\.json$/i.test(archivo)) {
      return { pedido: JSON.parse(crudo) as Pedido };
    }
    const { pedido, numerada } = parsearFicha(crudo);
    return {
      pedido: { ...pedido, cliente: a.cliente || pedido.cliente },
      aviso: numerada
        ? undefined
        : 'No encontre la ficha numerada: tome todo el texto como brief. Revisa que las respuestas vengan con 1. 2. 3.',
    };
  }

  if (!a.brief) {
    throw new Error('Falta el brief. Usa --brief "...", pasa un pedido.json o una ficha.txt');
  }

  return {
    pedido: {
      cliente: a.cliente || 'sin identificar',
      brief: a.brief,
      aspect: (a.aspect as Aspecto) || '16:9',
      uso: a.uso || '',
      evitar: a.evitar || '',
      personas_reales: a.personas_reales === 'true',
      marcas_o_personajes: a.marcas_o_personajes === 'true',
      estado_pago: a.estado_pago || 'pendiente',
    },
  };
}

function slug(texto: string): string {
  return (
    texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40) || 'secuencia'
  );
}

function fecha(): string {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function respuestaDiscord(
  pedido: Pedido,
  aspect: Aspecto,
  clips: ReturnType<typeof construirSecuencia>['clips'],
  negative: string,
  empalme: string,
): string {
  const bloques = clips
    .map((c) => `CLIP ${c.n} · 8 s\n\`\`\`\n${c.prompt}\n\`\`\``)
    .join('\n\n');

  return `Secuencia lista, ${pedido.cliente}. ${clips.length} clips de 8 s, ${aspect}.

${bloques}

NEGATIVO (va en los tres, o como negative prompt si tu motor lo tiene aparte)
\`\`\`
${negative}
\`\`\`

CÓMO EMPALMAR
${empalme}

CONDICIONES
${PRODUCTO.nombre}: tres clips encadenados, un estilo, una revisión. ${PRODUCTO.precio}.
Se entrega la dirección y los prompts; el render corre por tu cuenta.
Sin exclusividad: una salida de modelo no es obra protegible.
Las salidas llevan marca SynthID del modelo, detectable como generada.
No se aceptan personas reales sin consentimiento por escrito, marcas ni personajes con derechos, contenido sexual, violencia gráfica ni menores.

Si un clip no te queda, dime qué cambió (encuadre, luz, velocidad) y te ajusto el prompt, no la idea.`;
}

function main() {
  const { pedido, aviso } = leerPedido();
  const brief = String(pedido.brief || '').trim();
  const aspect: Aspecto = pedido.aspect === '9:16' ? '9:16' : '16:9';

  if (aviso) console.log(`\nAVISO: ${aviso}`);

  const motivos: string[] = [];
  if (brief.length < 10) motivos.push('el brief es muy corto: minimo 10 caracteres');
  if (brief.length > 1200) motivos.push('el brief es muy largo: tope 1200 caracteres');
  if (pedido.personas_reales) motivos.push('declara personas reales: hace falta consentimiento por escrito');
  if (pedido.marcas_o_personajes) motivos.push('declara marcas o personajes con derechos: no se acepta');
  motivos.push(...revisarBrief(brief).motivos);

  const id = `${fecha()}-${slug(brief)}`;
  const registro = {
    id,
    recibido: new Date().toISOString(),
    cliente: pedido.cliente,
    brief,
    aspect,
    uso: pedido.uso || '',
    evitar: pedido.evitar || '',
    estado_pago: pedido.estado_pago || 'pendiente',
    decision: motivos.length === 0 ? 'aceptado' : 'rechazado',
    motivos,
    precio: PRODUCTO.precio,
  };

  mkdirSync(SALIDA, { recursive: true });

  if (motivos.length > 0) {
    writeFileSync(join(SALIDA, `${id}-rechazado.json`), JSON.stringify(registro, null, 2), 'utf8');
    console.log(`\nPEDIDO ${id}\nDECISION: RECHAZADO\n`);
    const lista = motivos.map((m, i) => `${i + 1}. ${m}`).join('\n');
    console.log(lista);
    console.log(`\nRegistro: ${join(SALIDA, `${id}-rechazado.json`)}`);
    console.log('\nRespuesta corta para el canal:\n');
    console.log(`Gracias por el pedido. No lo puedo tomar por esto:\n${lista}\n\nSi ajustas el brief, lo reviso de nuevo.`);
    process.exitCode = 2;
    return;
  }

  const secuencia = construirSecuencia(brief, aspect, pedido.evitar);
  const dudas = dudasDelPedido(brief, pedido.evitar);
  const texto = respuestaDiscord(pedido, aspect, secuencia.clips, secuencia.negative, secuencia.empalme);

  writeFileSync(
    join(SALIDA, `${id}.json`),
    JSON.stringify({ ...registro, secuencia, dudas, respuesta: texto }, null, 2),
    'utf8',
  );
  writeFileSync(join(SALIDA, `${id}.txt`), texto, 'utf8');
  appendFileSync(join(SALIDA, '_pedidos.ndjson'), JSON.stringify(registro) + '\n', 'utf8');

  console.log(`\nPEDIDO ${id}`);
  console.log(`cliente: ${pedido.cliente}`);
  console.log(`precio: ${PRODUCTO.precio} (${registro.estado_pago})`);
  console.log(`\nLECTURA DEL PEDIDO`);
  console.log(`  sujeto: ${brief}`);
  console.log(`  formato: ${aspect}, 3 clips de 8 s (24 s)`);
  console.log(`  materia de empalme: ${secuencia.material}`);
  console.log(`  uso: ${pedido.uso || 'no dijo'}`);
  console.log(`  evitar: ${pedido.evitar || 'no dijo'}`);

  if (dudas.length) {
    console.log(`\nPREGUNTAS ANTES DE RENDERIZAR`);
    dudas.forEach((d, i) => console.log(`  ${i + 1}. ${d}`));
  } else {
    console.log(`\nEl pedido esta completo: no hay huecos que preguntar.`);
  }

  console.log(`\nRegistro: ${join(SALIDA, `${id}.json`)}`);
  console.log(`\n===== RESPUESTA PARA EL CANAL =====\n\n${texto}`);
}

main();
