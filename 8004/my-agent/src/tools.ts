/**
 * MCP Tools Definition - entropiav2
 * 
 * Tools expuestos para agentes A2A y clientes MCP:
 * - chat: Conversacion general con el agente
 * - generate_composition: Genera composicion de videodanza desde parametros
 * - generate_contract: Genera codigo Solidity para smart contracts
 * - describe_nft: Genera descripcion poetica para un NFT
 * - get_agent_info: Info del agente y sus capacidades
 */

import { generateResponse, generateContract, generateComposition, generateNFTDescription, type CompositionParams } from './agent.js';

// ============================================================================
// Tool Definitions
// ============================================================================

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
];

// ============================================================================
// Tool Implementations
// ============================================================================

export async function handleToolCall(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'chat': {
      const message = args.message as string;
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

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
