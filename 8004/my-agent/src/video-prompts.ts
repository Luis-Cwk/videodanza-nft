/**
 * Constructor de secuencias de video encadenadas - entropiav2
 *
 * Una secuencia = tres clips de 8 s que empalman por un objeto fisico que llena
 * el cuadro, no por un corte. El CANON va identico en los tres: misma camara,
 * misma luz, mismo grano, mismo movimiento. Lo unico que cambia es el sujeto
 * que pide el cliente.
 *
 * Deterministico a proposito: mismo brief, misma secuencia. No gasta modelo y
 * no puede fallar a media respuesta. El texto del brief se pega tal cual en el
 * bloque SUBJECT; el resto del prompt va en ingles porque asi lo leen mejor los
 * motores de video.
 */

export type Aspecto = '16:9' | '9:16';

export interface ClipSecuencia {
  n: number;
  duration_s: number;
  first_frame: string;
  salida: string;
  prompt: string;
}

export interface Secuencia {
  brief: string;
  aspect: Aspecto;
  material: string;
  duracion_total_s: number;
  canon: string;
  clips: ClipSecuencia[];
  negative: string;
  empalme: string;
  settings: Record<string, string>;
}

/** Lo que no se acepta. Primer filtro por texto, no es garantia. */
const BLOQUEOS: Array<{ re: RegExp; motivo: string }> = [
  {
    re: /\b(nsfw|porn\w*|er[oó]tic\w*|sexual\w*|sexo|hentai|contenido adulto|desnudo integral|explicit)\b/i,
    motivo: 'contenido sexual explicito: no se acepta',
  },
  {
    re: /\b(ni[nñ][oa]s?|menor(?:es)? de edad|underage|child|children|toddler)\b/i,
    motivo: 'personas menores de edad: no se genera ningun clip con menores',
  },
  {
    re: /\b(gore|sangre|blood|decapit\w*|mutilat\w*|tortura|torture)\b/i,
    motivo: 'violencia grafica: no se acepta',
  },
  {
    re: /\b(mickey|pikachu|batman|superman|disney|marvel|star wars|harry potter|pokemon)\b/i,
    motivo: 'personajes o franquicias con derechos: no se acepta',
  },
  {
    re: /\b(logotipo|logo de|marca registrada|trademark|brand logo|imagen corporativa|spot publicitario)\b/i,
    motivo: 'marcas y logotipos: no se acepta',
  },
  {
    re: /\b(clonar la voz|deepfake|sin su consentimiento|without (?:his|her|their) consent)\b/i,
    motivo: 'suplantacion de una persona sin consentimiento: no se acepta',
  },
];

/** El material que hace el empalme: lo que llena el cuadro entre clip y clip. */
const MATERIALES: Array<{ re: RegExp; frase: string; corto: string }> = [
  {
    re: /\b(cuerpos?|danza|bail\w*|body|dance|piel|skin|manos?|hand|gesto)\b/i,
    frase: 'an open palm, close enough that the skin texture and the fine lines of the hand are readable',
    corto: 'an open palm filling the frame',
  },
  {
    re: /\b(agua|mar|r[ií]os?|lluvia|water|river|rain|valle|valley|marea)\b/i,
    frase: 'a sheet of falling water, close enough that the threads and the surface tension are readable',
    corto: 'falling water filling the frame',
  },
  {
    re: /\b(telas?|textil\w*|hilos?|tejido|fabric|cloth|textile|bordado)\b/i,
    frase: 'a sheet of translucent fabric, close enough that the weave and the folds are readable',
    corto: 'translucent fabric filling the frame',
  },
  {
    re: /\b(tierra|barro|arcilla|polvo|earth|clay|soil|dust|piedra|stone)\b/i,
    frase: 'a wall of dry earth, close enough that the grains and the cracks are readable',
    corto: 'dry earth filling the frame',
  },
  {
    re: /\b(vidrio|cristal|glass|ventana|window|espejo|mirror)\b/i,
    frase: 'a thick pane of glass, close enough that its imperfections and reflections are readable',
    corto: 'a pane of glass filling the frame',
  },
];

const MATERIAL_DEFAULT = {
  frase: 'a sheet of clear acetate, close enough that the dust and the edge highlights are readable',
  corto: 'a sheet of clear acetate filling the frame',
};

function mayus(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function canon(aspect: Aspecto): string {
  const encuadre =
    aspect === '9:16'
      ? 'Framing vertical 9:16, subject centered, full body head to feet when wide, extra headroom above.'
      : 'Framing horizontal 16:9, subject off center, full body head to feet when wide.';

  return `CANON, identical in every clip, do not alter: single unbroken take, no cuts, no transitions, no fade. Same 35mm lens, same camera height at chest level, constant lateral dolly in one direction at slow walking pace, no zoom, no handheld. One hard sidelight from camera left, no fill, background dark to black. Palette: black, bone white, one warm accent. Fine 35mm grain, same density. Matte floor. Audio: room tone, cloth, breath, faint mechanical hum, no music. ${encuadre} No on-screen text, no captions, no dialogue, no new characters, no color shift.`;
}

export function elegirMaterial(brief: string): { frase: string; corto: string } {
  for (const m of MATERIALES) {
    if (m.re.test(brief)) return { frase: m.frase, corto: m.corto };
  }
  return MATERIAL_DEFAULT;
}

export function revisarBrief(brief: string): { ok: boolean; motivos: string[] } {
  const motivos: string[] = [];
  for (const b of BLOQUEOS) {
    if (b.re.test(brief)) motivos.push(b.motivo);
  }
  return { ok: motivos.length === 0, motivos };
}

const NEGATIVE =
  'no cuts, no zoom, no text, no captions, no dialogue, no new characters, no extra people, no logos, no readable letters, no camera shake, no speed ramp, no color grade, no split screen, no morphing faces';

/** Lo que el cliente pidio no ver se suma al negativo, no al brief. */
function negativoCon(evitar?: string): string {
  const extra = (evitar || '').trim();
  if (!extra) return NEGATIVE;
  return `${NEGATIVE}, avoid in every clip: ${extra}`;
}

/**
 * Preguntas que conviene hacer antes de renderizar. No es un modelo: es una
 * lista de huecos tipicos en un pedido de video, para no adivinar.
 */
export function dudasDelPedido(brief: string, evitar?: string): string[] {
  const dudas: string[] = [];
  const t = brief.toLowerCase();
  const hay = (palabras: string[]) => palabras.some((p) => new RegExp(`\\b${p}\\b`, 'i').test(t));

  if (brief.trim().length < 60) {
    dudas.push('El brief es corto: con esto caben tres lecturas. Pide una frase mas de accion concreta.');
  }
  if (!hay(['cuarto', 'sala', 'estudio', 'calle', 'bosque', 'valle', 'mar', 'campo', 'plaza', 'interior', 'exterior', 'fondo', 'set', 'stage', 'room', 'studio', 'forest', 'street', 'casa', 'galeria', 'azotea'])) {
    dudas.push('No dice donde pasa. El espacio decide la luz y el fondo.');
  }
  if (!MATERIALES.some((m) => m.re.test(brief))) {
    dudas.push('No dice que materia aparece. De eso depende el objeto que hace el empalme.');
  }
  if (/(mi (?:amig|novi|herman|prim|parej)|su (?:cara|foto)|retrato de)/.test(t)) {
    dudas.push('Parece que hay una persona real. Confirma consentimiento por escrito antes de aceptar.');
  }
  if (/(como|estilo|parecido a|inspirado en|tipo )/.test(t) && /(pelicula|película|serie|video|videojuego|marca|cantante)/.test(t)) {
    dudas.push('La referencia es amplia: pregunta si quiere la luz, la paleta o el movimiento de camara. No las tres.');
  }
  if (!evitar || !evitar.trim()) {
    dudas.push('No dijo que no quiere ver. Pregunta por lo que le ha fallado antes con videos generados.');
  }

  return dudas.slice(0, 4);
}

const EMPALME = [
  'En Gemini o Veo usa Frames to video: baja el MP4 de cada clip, extrae el ultimo frame',
  'y subelo como primer frame del siguiente. Con ffmpeg: ffmpeg -sseof -0.1 -i clip1.mp4 -frames:v 1 ultimo1.png',
  'El prompt describe el clip desde ese frame. No cambies la relacion de aspecto entre clips.',
  'Si al revisar queda un salto de un frame, un dissolve de 3 o 4 frames lo tapa sin leerse como corte.',
].join(' ');

export function construirSecuencia(brief: string, aspect: Aspecto, evitar?: string): Secuencia {
  const sujeto = brief.trim().replace(/\s+/g, ' ');
  const material = elegirMaterial(sujeto);
  const bloque = canon(aspect);

  const clips: ClipSecuencia[] = [
    {
      n: 1,
      duration_s: 8,
      first_frame: 'none, este clip abre la secuencia',
      salida: material.corto,
      prompt: `[first frame: none, this clip opens the sequence]
Single continuous shot. Subject, follow literally: ${sujeto}. The camera is already moving at constant speed and never stops. Nothing is explained. Over eight seconds the subject performs one slow deliberate action while the space loses detail: the background drains toward black, the edges soften, only the subject stays sharp. The camera keeps moving until the frame is filled by something very close to the lens: ${material.frase}. It holds there, in focus and still, for the last second. The clip ends on ${material.corto}.
${bloque}`,
    },
    {
      n: 2,
      duration_s: 8,
      first_frame: material.corto,
      salida: material.corto,
      prompt: `[first frame: the last frame of clip 1, ${material.corto}]
Single continuous shot. The frame starts already filled by something very close to the lens: ${material.frase}. It passes and reveals the same subject, same wardrobe, same light, mid transformation: a second layer grows over the subject, either a thin white line structure or a point cloud sampled from the subject's own silhouette, and it locks to the movement with no drift. The camera resumes the same constant move in the same direction. The clip ends when ${material.corto} crosses the lens again and fills the frame.
${bloque}`,
    },
    {
      n: 3,
      duration_s: 8,
      first_frame: material.corto,
      salida: 'el sujeto quieto, respirando',
      prompt: `[first frame: the last frame of clip 2, ${material.corto}]
Single continuous shot. ${mayus(material.corto)} passes and clears. The camera keeps the same speed and the same direction. The space opens and reassembles around the transformed figure into one single structure that holds. The movement slows to stillness. The clip ends on the subject standing still, breathing, the second layer faint on the subject.
${bloque}`,
    },
  ];

  return {
    brief: sujeto,
    aspect,
    material: material.corto,
    duracion_total_s: clips.reduce((t, c) => t + c.duration_s, 0),
    canon: bloque,
    clips,
    negative: negativoCon(evitar),
    empalme: EMPALME,
    settings: {
      aspect_ratio: aspect,
      duration_per_clip: '8 s',
      total: `${clips.reduce((t, c) => t + c.duration_s, 0)} s`,
      fps: '24',
      resolution: '720p o 1080p, igual en los tres clips',
      chain: 'frames to video, ultimo frame como primer frame del siguiente',
    },
  };
}

/** Lo que se vende cuando la ruta pagada este abierta. */
export const PRODUCTO = {
  nombre: 'Secuencia entropia',
  precio: '1.50 USDC',
  unidad: 'tres clips encadenados de 8 s, un solo encargo',
  incluye: [
    'los tres prompts con CANON identico y el frame de empalme',
    'un estilo, un encargo, una revision',
    '16:9 o 9:16',
    'entrega en 24 a 48 h segun cupo',
  ],
  no_incluye: [
    'personas reales sin consentimiento por escrito',
    'marcas, logotipos ni personajes con derechos',
    'contenido sexual, violencia grafica ni menores',
    'exclusividad: el archivo no es obra protegible, es direccion y render',
  ],
  requiere_confirmacion: [
    'no hay personas reales identificables sin consentimiento por escrito',
    'no hay marcas, logotipos ni personajes con derechos',
    'el uso previsto es legal en tu jurisdiccion',
  ],
  cupo: 'un encargo por dia; son tres clips, que es el tope real de generacion',
};

