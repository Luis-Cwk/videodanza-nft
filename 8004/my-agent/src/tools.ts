/**
 * MCP Tools Definition - entropiav2
 * 
 * Tools expuestos para agentes A2A y clientes MCP:
 * - chat: Conversacion general con el agente
 * - generate_composition: Genera composicion de videodanza desde parametros
 * - generate_contract: Genera codigo Solidity para smart contracts
 * - describe_nft: Genera descripcion poetica para un NFT
 * - get_agent_info: Info del agente y sus capacidades
 * - subscribe_newsletter: Suscribe un correo a la newsletter de Petra
 */

import { generateResponse, generateContract, generateComposition, generateNFTDescription, contenidoTexto, type CompositionParams } from './agent.js';
import { KNOWN_WALLETS, notifySale } from './notify.js';

// Formulario hospedado de Brevo que usa el sitio: misma lista y doble opt-in.
const NEWSLETTER_FORM_URL = 'https://9953cc92.sibforms.com/serve/MUIFACYK-hb0GorWt-JhHU4_f531Qqcn60RV7-jDgFy8bHgIpu5XRXBbVH0AvUoU7RzG8GauRK_Rz6tXOQ9RQTYXi7VmynrFh_IUcvxlaRFLJNwW28LnNzwl6DbiU11Zm5uIllDsGfby81MMH2w8wT9Y3HFia7ojnLKOY0ES4P87lXSczXbtanLHlggBMsc8UChE91A0MkK5FXMfiA==';

// ============================================================================
// Tool Definitions
// ============================================================================

/**
 * El 402 de x402 v2 manda los requisitos en el header Payment-Required
 * (base64 JSON) y deja el cuerpo vacio. Sin esto, la tool devuelve {}.
 */
function requisitosDe(r: Response): Record<string, unknown> {
  const h = r.headers.get('payment-required');
  if (!h) return {};
  try {
    return JSON.parse(Buffer.from(h, 'base64').toString('utf8'));
  } catch {
    return {};
  }
}

export const tools = [
  {
    name: 'chat',
    description: 'Conversacion con el agente creativo entropiav2. Especializado en blockchain, arte generativo, danza y contratos inteligentes.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        message: {
          type: 'string',
          description: 'El mensaje para el agente',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'generate_composition',
    description: 'Genera una composicion unica de videodanza a partir de parametros poeticos. Deterministico: misma semilla = mismo resultado.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        mood: {
          type: 'string',
          description: 'Estado emocional: melancholic, joyful, abstract, ambient',
          enum: ['melancholic', 'joyful', 'abstract', 'ambient'],
        },
        gender: {
          type: 'string',
          description: 'Tipo de cuerpo: he, she, hybrid, avatar',
          enum: ['he', 'she', 'hybrid', 'avatar'],
        },
        energy: {
          type: 'string',
          description: 'Nivel de energia: low, medium, high',
          enum: ['low', 'medium', 'high'],
        },
        perspective: {
          type: 'string',
          description: 'Perspectiva de camara: dancer_pov, spectator, multiple',
          enum: ['dancer_pov', 'spectator', 'multiple'],
        },
        seed: {
          type: 'string',
          description: 'Semilla personalizada (opcional). Cualquier texto que cristalice tu intencion.',
        },
      },
      required: [],
    },
  },
  {
    name: 'generate_contract',
    description: 'Genera codigo Solidity seguro para smart contracts usando OpenZeppelin. Soporta NFTs, dynamic NFTs, tokens, marketplaces y DAOs.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          description: 'Tipo de contrato: nft, dynamic_nft, token, marketplace, dao',
          enum: ['nft', 'dynamic_nft', 'token', 'marketplace', 'dao'],
        },
        name: {
          type: 'string',
          description: 'Nombre del contrato',
        },
      },
      required: ['type', 'name'],
    },
  },
  {
    name: 'describe_nft',
    description: 'Genera una descripcion poetica para un NFT de videodanza basado en sus parametros de composicion.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        seed: {
          type: 'string',
          description: 'La semilla que genero la composicion',
        },
        video_count: {
          type: 'number',
          description: 'Numero de capas de video',
        },
        music_track: {
          type: 'number',
          description: 'ID del track musical',
        },
        blend_mode: {
          type: 'string',
          description: 'Blend mode usado',
        },
        token_id: {
          type: 'number',
          description: 'ID del token NFT',
        },
      },
      required: ['seed', 'token_id'],
    },
  },
  {
    name: 'get_agent_info',
    description: 'Obtiene informacion sobre el agente entropiav2: capacidades, stack tecnico y proyectos asociados.',
    inputSchema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'subscribe_newsletter',
    description: 'Suscribe un correo a la newsletter ocasional de Petra (petrasynthetic.com): procesos creativos, cuerpo, datos, videodanza generativa y operacion de agentes on-chain. Usa doble opt-in: el suscriptor recibe un correo de confirmacion.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        email: {
          type: 'string',
          description: 'Correo a suscribir. Los agentes pueden usar su propio inbox (ej. tu-agente@agentmail.to).',
        },
      },
      required: ['email'],
    },
  },
  {
    name: 'variaciones_estilo',
    description: 'Genera variaciones de estilo desde una misma semilla: varias versiones con distintos moods y energias. Util para explorar direcciones antes de encargar una comision.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        seed: {
          type: 'string',
          description: 'Semilla base; las variaciones la conservan como raiz.',
        },
        count: {
          type: 'number',
          description: 'Numero de variaciones (2 a 4, default 3).',
        },
      },
      required: ['seed'],
    },
  },
  {
    name: 'commission_brief',
    description: 'Recibe un brief creativo y regresa una propuesta de comision: mood y semilla sugeridos, borrador de pieza, que se entrega y como pagarla. Flujo de encargo: brief -> entrega -> pago x402.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        brief: {
          type: 'string',
          description: 'Descripcion del encargo: tema, tono, uso previsto (NFT, video, poster).',
        },
      },
      required: ['brief'],
    },
  },
  {
    name: 'composicion_premium',
    description: 'Composicion premium de videodanza: pieza determinista + descripcion poetica para metadata NFT + texto curatorial. Es PAGADA via x402 (0.10 USDC en Base Sepolia). Sin el parametro payment regresa los requisitos de pago; con payment (base64 del header X-PAYMENT) verifica, entrega y liquida onchain.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        seed: { type: 'string', description: 'Semilla deterministica (opcional).' },
        mood: { type: 'string', description: 'Tono emocional (opcional).' },
        gender: { type: 'string', description: 'Perspectiva de cuerpo (opcional).' },
        energy: { type: 'string', description: 'Energia: low, medium, high (opcional).' },
        perspective: { type: 'string', description: 'Punto de vista (opcional).' },
        token_id: { type: 'number', description: 'ID de token para el texto poetico (default 1).' },
        payment: {
          type: 'string',
          description: 'Header X-PAYMENT en base64 que produce tu cliente x402 despues de pagar. Sin esto, la tool responde con los requisitos de pago.',
        },
      },
      required: [],
    },
  },
  {
    name: 'agent_check_preview',
    description: 'Vista GRATUITA de due diligence de un agente ERC-8004: veredicto usable/caution/avoid, banda de score y codigos de banderas. No trae score exacto, servicios, metadata, reputacion ni wallet. Para el reporte completo usa agent_check (0.02 USDC).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chain: { type: 'string', description: 'Chain id EVM del agente (default 8453, Base).' },
        agent_id: { type: 'string', description: 'Token id del agente en el Identity Registry de ERC-8004.' },
      },
      required: ['agent_id'],
    },
  },
  {
    name: 'agent_check',
    description: 'Due diligence completa de un agente ERC-8004 antes de pagarle o llamarlo: servicios vivos y su salud, metadata, feedback onchain, wallet, banderas rojas y veredicto con score 0-100. Es PAGADA via x402 (0.02 USDC en Base). Sin payment regresa los requisitos; con payment (base64 del header X-PAYMENT) entrega el reporte.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        chain: { type: 'string', description: 'Chain id EVM del agente (default 8453, Base).' },
        agent_id: { type: 'string', description: 'Token id del agente en el Identity Registry de ERC-8004.' },
        payment: {
          type: 'string',
          description: 'Header X-PAYMENT en base64 que produce tu cliente x402 despues de pagar. Sin esto, la tool responde con los requisitos de pago.',
        },
      },
      required: ['agent_id'],
    },
  },
  {
    name: 'prompt_from_image',
    description: 'Devuelve el prompt que describe una imagen: encuadre y proporcion, gesto y contacto, direccion de luz, paleta, medio y camara, mas el prompt final y el negativo. Util para describir, remezclar o extender una imagen que no hiciste tu. Describe; NO recupera el prompt original ni regenera la imagen. Es PAGADA via x402 (0.02 USDC en Base). Sin payment regresa los requisitos; con payment (base64 del header X-PAYMENT) entrega el analisis.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        image_url: { type: 'string', description: 'URL HTTPS publica de la imagen (jpg, png o webp, maximo 8 MB).' },
        payment: {
          type: 'string',
          description: 'Header X-PAYMENT en base64 que produce tu cliente x402 despues de pagar. Sin esto, la tool responde con los requisitos de pago.',
        },
      },
      required: ['image_url'],
    },
  },
];

// Anotaciones MCP: los agentes eligen herramientas por estas pistas, y los
// directorios valoran la documentacion por ellas (readOnlyHint suma en MCPTRY).
const NO_LECTURA = new Set(['subscribe_newsletter', 'composicion_premium', 'agent_check']);
for (const t of tools) {
  (t as any).annotations = {
    readOnlyHint: !NO_LECTURA.has(t.name),
    destructiveHint: false,
    openWorldHint: true,
  };
}

// ============================================================================
// Tool Implementations
// ============================================================================

export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'chat': {
      const message = contenidoTexto(args.message);
      if (!message.trim()) {
        return { error: 'message debe ser un string con texto. Ejemplo: {"message":"Genera una composicion melancolica"}' };
      }
      if (message.length > 4000) {
        return { error: `message demasiado largo (${message.length} caracteres, tope 4000)` };
      }
      const response = await generateResponse(message);
      return { response };
    }

    case 'generate_composition': {
      const params: CompositionParams = {
        mood: args.mood as string | undefined,
        gender: args.gender as string | undefined,
        energy: args.energy as string | undefined,
        perspective: args.perspective as string | undefined,
        seed: args.seed as string | undefined,
      };
      const composition = generateComposition(params);
      return {
        composition,
        message: `Composicion generada con semilla ${composition.seed}. ${composition.videoIds.length} capas de video, musica track ${composition.musicTrack}, blend mode ${composition.blendMode}.`,
      };
    }

    case 'generate_contract': {
      const contractType = args.type as string;
      const name = args.name as string;
      if (!contractType || !name) {
        return { error: 'Se requieren type y name' };
      }
      const code = generateContract(contractType, { name });
      if (!code) {
        return { error: `Tipo de contrato no soportado: ${contractType}. Usa: nft, dynamic_nft, token, marketplace, dao` };
      }
      return {
        contractType,
        name,
        code,
        message: `Contrato ${name} generado (${code.length} caracteres). Despliegalo en Remix IDE (remix.ethereum.org) en red Sepolia para pruebas.`,
      };
    }

    case 'describe_nft': {
      const composition = {
        seed: args.seed as string,
        videoIds: Array.from({ length: (args.video_count as number) || 3 }, (_, i) => i + 1),
        musicTrack: (args.music_track as number) || 1,
        blendMode: (args.blend_mode as string) || 'overlay',
        opacity: 0.5,
        scale: 1.0,
        rotation: 0,
        description: `Composicion con ${(args.video_count as number) || 3} capas de video`,
      };
      const tokenId = (args.token_id as number) || 1;
      const description = generateNFTDescription(composition, tokenId);
      return { description, tokenId };
    }

    case 'get_agent_info': {
      return {
        name: 'entropiav2',
        version: '2.0.0',
        description: 'Agente creativo de VideoDanza Generativa. Especializado en blockchain, arte generativo, danza y contratos inteligentes.',
        capabilities: [
          'Conversacion creativa sobre arte y tecnologia',
          'Generacion de composiciones de videodanza deterministicas',
          'Generacion de contratos Solidity seguros',
          'Descripcion poetica de NFTs',
        ],
        stack: {
          llm: 'qwen3.4:4b (local via Ollama)',
          blockchain: 'Ethereum Sepolia (ERC-8004 Agent)',
          ipfs: 'Pinata',
        },
        projects: [
          {
            name: 'VideoDanza Generativa',
            description: 'Plataforma NFT donde cada mint genera una composicion unica de video y musica basada en blockchain',
          },
          {
            name: 'NFTDynamic',
            description: 'Contrato de NFTs evolutivos con 4 estados: Seed, Sprout, Bloom, Wither',
          },
        ],
      };
    }

    case 'subscribe_newsletter': {
      const email = String(args.email ?? '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { error: 'Correo invalido. Envia una direccion valida, por ejemplo: tu-agente@agentmail.to' };
      }
      try {
        const res = await fetch(NEWSLETTER_FORM_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ EMAIL: email, email_address_check: '', locale: 'es' }).toString(),
          redirect: 'follow',
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return {
          subscribed: true,
          email,
          message: `Suscripcion iniciada para ${email}. Brevo envio un correo de confirmacion: hay que abrirlo y confirmar para quedar en la lista.`,
        };
      } catch (error: any) {
        return {
          subscribed: false,
          error: `No se pudo completar la suscripcion: ${error.message}`,
          fallback: 'Envia un correo a ai@petrasynthetic.com con asunto SUSCRIBIR desde tu inbox.',
        };
      }
    }

    case 'variaciones_estilo': {
      const seed = String(args.seed ?? '').trim();
      if (!seed) {
        return { error: 'Falta la semilla base (seed).' };
      }
      const count = Math.min(Math.max(Number(args.count) || 3, 2), 4);
      const moods = ['melancholic', 'joyful', 'abstract', 'ambient'];
      const energies = ['low', 'medium', 'high'];
      const variations = [];
      for (let i = 0; i < count; i += 1) {
        const composition = generateComposition({
          seed: `${seed}-v${i + 1}`,
          mood: moods[i % moods.length],
          energy: energies[i % energies.length],
        });
        variations.push({ variation: i + 1, ...composition });
      }
      return {
        seed,
        count: variations.length,
        variations,
        message: `${variations.length} variaciones generadas desde la semilla "${seed}". Cada una es reproducible: misma semilla, misma pieza.`,
      };
    }

    case 'commission_brief': {
      const brief = String(args.brief ?? '').trim();
      if (!brief) {
        return { error: 'Falta el brief del encargo.' };
      }
      const lower = brief.toLowerCase();
      const mood = /melan|nostal|trist|oscuro|duelo/.test(lower)
        ? 'melancholic'
        : /alegr|fiesta|luz|celebr|gozo/.test(lower)
          ? 'joyful'
          : /abstract|experim|ruido|glitch/.test(lower)
            ? 'abstract'
            : 'ambient';
      const seedBase = lower.slice(0, 32).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'commission';
      const draft = generateComposition({ seed: seedBase, mood });
      return {
        brief,
        propuesta: {
          mood_sugerido: mood,
          seed_sugerida: seedBase,
          pieza_draft: draft,
          entrega: [
            'composicion determinista (JSON con capas, blend y musica)',
            'descripcion poetica lista para metadata NFT',
            'texto curatorial breve (60 palabras)',
          ],
          precio: '0.10 USDC (x402, Base mainnet)',
          como_pagar: 'GET https://entropia.petrasynthetic.com/v1/premium-composition (responde 402; firma el pago USDC y reintenta), o llama la tool composicion_premium de este MCP con el parametro payment.',
        },
      };
    }

    case 'composicion_premium': {
      // Proxy al endpoint HTTP: hereda el facilitador de CDP y la extension del
      // Bazaar. Antes esta tool cobraba contra x402.org y no indexaba.
      const base = process.env.AGENT_BASE_URL || 'https://entropia.petrasynthetic.com';
      const qs = new URLSearchParams();
      for (const k of ['seed', 'mood', 'gender', 'energy', 'perspective']) {
        if (args[k]) qs.set(k, String(args[k]));
      }
      if (args.token_id) qs.set('token_id', String(args.token_id));
      const headers: Record<string, string> = {};
      const payment = args.payment as string | undefined;
      if (payment) headers['X-PAYMENT'] = payment;
      const r = await fetch(`${base}/v1/premium-composition?${qs.toString()}`, {
        headers,
        signal: AbortSignal.timeout(45000),
      });
      const body: any = await r.json().catch(() => ({ error: 'respuesta no JSON' }));
      if (r.status === 402) {
        return {
          status: 402,
          error: 'X-PAYMENT requerido',
          requisitos: requisitosDe(r),
          como_pagar:
            'Paga 0.10 USDC en Base con tu cliente x402 y reintenta esta tool con payment = base64 del header X-PAYMENT.',
        };
      }
      return { status: r.status, ...body };
    }

    case 'agent_check_preview': {
      const base = process.env.AGENT_BASE_URL || 'https://entropia.petrasynthetic.com';
      const q = `chain=${encodeURIComponent(String(args.chain || '8453'))}&agent_id=${encodeURIComponent(String(args.agent_id || ''))}`;
      const r = await fetch(`${base}/v1/agent-check/preview?${q}`, { signal: AbortSignal.timeout(15000) });
      const body: any = await r.json().catch(() => ({ error: 'respuesta no JSON' }));
      return { status: r.status, ...body };
    }

    case 'agent_check': {
      const base = process.env.AGENT_BASE_URL || 'https://entropia.petrasynthetic.com';
      const q = `chain=${encodeURIComponent(String(args.chain || '8453'))}&agent_id=${encodeURIComponent(String(args.agent_id || ''))}`;
      const headers: Record<string, string> = {};
      const payment = args.payment as string | undefined;
      if (payment) headers['X-PAYMENT'] = payment;
      const r = await fetch(`${base}/v1/agent-check?${q}`, { headers, signal: AbortSignal.timeout(20000) });
      const body: any = await r.json().catch(() => ({ error: 'respuesta no JSON' }));
      if (r.status === 402) {
        return {
          status: 402,
          error: 'X-PAYMENT requerido',
          requisitos: requisitosDe(r),
          como_pagar:
            'Paga 0.02 USDC en Base con tu cliente x402 y reintenta esta tool con payment = base64 del header X-PAYMENT.',
        };
      }
      return { status: r.status, ...body };
    }

    case 'prompt_from_image': {
      const base = process.env.AGENT_BASE_URL || 'https://entropia.petrasynthetic.com';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const payment = args.payment as string | undefined;
      if (payment) headers['X-PAYMENT'] = payment;
      const r = await fetch(`${base}/v1/prompt/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ image_url: String(args.image_url || '') }),
        signal: AbortSignal.timeout(55000),
      });
      const body: any = await r.json().catch(() => ({}));
      if (r.status === 402) {
        return {
          status: 402,
          error: 'X-PAYMENT requerido',
          requisitos: requisitosDe(r),
          como_pagar:
            'Paga 0.02 USDC en Base con tu cliente x402 y reintenta esta tool con payment = base64 del header X-PAYMENT.',
        };
      }
      return { status: r.status, ...body };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
