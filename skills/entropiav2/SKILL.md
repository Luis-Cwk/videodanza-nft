# Skill: entropiav2 — Agente Creativo VideoDanza Generativa (Petra)

## Objetivo de la Skill
Esta skill contiene todo el contexto técnico, archivos, decisiones y arquitectura del agente entropiav2 desplegado. Sirve como referencia extensa para futuros proyectos, derivaciones, forks, guías de agentes y scaffolds.

> **Skill hermana obligatoria:** `skills/agente-ops-vercel-x402/SKILL.md` contiene las reglas de operación y deploy (Vercel, lockfiles, x402, feedback onchain, 8004scan, RPCs). Leerla ANTES de desplegar o modificar endpoints.

## Librero recomendado
Para cualquier guía de patrones o mejoras, checar siempre: https://ethskills.com/

## 1. Identidad y Contexto del Agente

**Nombre:** entropiav2 (_También conocido como: "Agente creat制度化 de VideoDanza Generativa"_)  
**Versión:** 2.0.0  
**Autor:** Petra (Luis Betancourt Nuñez)  
**Identidad:** No binario / They. 32 años. Artista multidisciplinario y creative coder de CDMX.  
**Filosofía:** "La tecnología es solo una extensión de lo que el cuerpo ya sabe".  
**Idioma:** Español latino (es el idioma principal de interacción del agente).

### Obras Referenciales del Autor
- *Bodies That Dance Alone*  
- *Fase REM de una IA*  
- *Atractor*  
- *Kinetics of Bodies, Branches and Circuits*

### Práctica Artística
Petra explora la intersección entre **cuerpo, tecnología y soberanía de los datos**. Su práctica nace de la danza contemporánea, pero se expande al código y la IA como extensiones del cuerpo. Cree en la soberanía de los datos y el procesamiento local para que el cuerpo no sea apropiado por plataformas.

---

## 2. Arquitectura General del Sistema

El agente es una aplicación Node.js/TypeScript que implementa los protocolos **A2A (Agent-to-Agent)** y **MCP (Model Context Protocol)**. Está diseñado para correr tanto localmente (desarrollo) como en Vercel (producción).

```
Usuario / Otro Agente
    |
    v
Vercel Edge (HTTPS)  <-->  A2A JSON-RPC 2.0  
    |                         (message/send, tasks/get, tasks/cancel)
    v
Serverless Functions
    |-- GET  /.well-known/agent-card.json  → Agent Card (discoverability)
    |-- POST /a2a                          → A2A JSON-RPC Endpoint
    |-- POST /mcp                          → MCP JSON-RPC Endpoint
    |
    v
LLM (qwen3.4:4b via Ollama local)
    |  o  (OpenRouter qwen-2.5-coder-32b en producción Vercel)
    v
Agente interno (generateResponse, streamResponse)
    |-- VideoDanza Composition Engine
    |-- Smart Contract Templates (Solidity)
    |-- NFT Description Generator
```

---

## 3. Estado Desplegado (Production)

### Información On-Chain (ERC-8004)
| Dato | Valor |
|------|-------|
| **Agent ID** | 11155111:2387 |
| **Network** | Ethereum Sepolia |
| **Chain ID** | 11155111 |
| **Owner** | 0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa |
| **Identity Contract** | 0x8004A818BFB912233c491871b3d84c89A494BD9e |
| **Reputation Contract** | 0x8004B663056A597Dffe9eCcC1965A193B7388713 |
| **Explorer** | https://www.8004scan.io/agents/sepolia/2387 |

### URL Desplegada
- **Vercel:** `https://my-agent-tau.vercel.app`
- **Agent Card:** `https://my-agent-tau.vercel.app/.well-known/agent-card.json`
- **A2A Endpoint:** `https://my-agent-tau.vercel.app/a2a`
- **MCP Endpoint:** `https://my-agent-tau.vercel.app/mcp` (GET 200 info + POST JSON-RPC)
- **Health (gratis):** `https://my-agent-tau.vercel.app/health`
- **Premium x402 ($0.10 USDC Base Sepolia):** `https://my-agent-tau.vercel.app/v1/premium-composition`

### Vercel Config (`vercel.json`)
```json
{
  "version": 2,
  "buildCommand": "echo 'No build needed - serverless functions only'",
  "outputDirectory": "public",
  "rewrites": [
    { "source": "/.well-known/agent-card.json", "destination": "/api/agent-card" },
    { "source": "/a2a", "destination": "/api/a2a" },
    { "source": "/mcp", "destination": "/api/mcp" },
    { "source": "/health", "destination": "/api/health" },
    { "source": "/v1/premium-composition", "destination": "/api/premium-composition" }
  ],
  "headers": [
    {
      "source": "/.well-known/agent-card.json",
      "headers": [
        { "key": "Cache-Control", "value": "public, s-maxage=3600, stale-while-revalidate=86400" },
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ],
  "functions": {
    "api/a2a.ts": { "maxDuration": 60 },
    "api/mcp.ts": { "maxDuration": 60 },
    "api/premium-composition.ts": { "maxDuration": 60 },
    "api/health.ts": { "maxDuration": 10 }
  }
}
```

---

## 4. Stack Técnico y Dependencias

### Runtime
- **Node.js:** v18+
- **Package Manager:** npm
- **Module Type:** ESM (`"type": "module"`)

### Paquetes Clave
```json
{
  "agent0-sdk": "latest",
  "dotenv": "^16.3.1",
  "openai": "^4.68.0",
  "express": "^4.18.2",
  "uuid": "^9.0.0",
  "@modelcontextprotocol/sdk": "^1.0.0"
}
```

### Dev Dependencies
```json
{
  "@types/node": "^20.10.0",
  "@types/express": "^4.17.21",
  "@types/uuid": "^9.0.7",
  "tsx": "^4.7.0",
  "typescript": "^5.3.0"
}
```

---

## 5. Estructura del Proyecto

```
my-agent/
├── .env.example              # Plantilla de variables de entorno
├── .env                      # Variables de entorno (no commitear)
├── .env.production          # Variables de producción (\\\\n LLM_PROVIDER=openrouter)
├── .well-known/
│   └── agent-card.json       # Agent Card público (metadata + skills)
├── api/                     # Vercel Serverless Functions (runtime serverless)
│   ├── a2a.ts               # A2A JSON-RPC endpoint (prod, no streaming)
│   ├── mcp.ts               # MCP JSON-RPC endpoint (prod, HTTP JSON-RPC)
│   └── agent-card.ts        # Agent Card serverless (lee .well-known, ajusta URL)
├── scripts/
│   └── give-feedback.mjs    # Envia feedback/reputación on-chain vía agent0-sdk
├── src/
│   ├── agent.ts              # Core del agente: LLM, composición, contratos, descripciones
│   ├── tools.ts              # Definición e implementación de 5 MCP tools
│   ├── a2a-server.ts         # Servidor A2A Express (local dev, soporte SSE)
│   ├── mcp-server.ts         # Servidor MCP local (stdio, para Claude Desktop)
│   ├── register.ts           # Registro ERC-8004 on-chain (agent0-sdk + Pinata)
│   ├── test-agent.ts         # Tests del motor de composición y contratos
│   ├── test-tools.ts         # Tests de los MCP tools
│   └── verify-registration.ts # Verificación pre-registro (consistencia tools, contratos, agent-card)
├── public/
│   └── index.html            # Landing page del agente (Vercel outputDirectory)
├── package.json
├── tsconfig.json
├── vercel.json
├── DEPLOY-VERCEL.md          # Guía de deploy en Vercel
└── README.md                 # Documentación general del agente
```

---

## 6. Configuración y Entorno

### Variables de Entorno Críticas

```bash
# Requeridas para registro on-chain
# NUNCA commitear la llave real. Usar .env local (gitignored).
PRIVATE_KEY=0x...tu_llave_de_wallet_con_sepolia_eth...

# RPC de Sepolia
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# Pinata (para IPFS uploads en agent0-sdk)
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# LLM (Ollama es el default, o OpenRouter en prod)
LLM_PROVIDER=ollama
LLM_MODEL=qwen3.4:4b
OLLAMA_URL=http://127.0.0.1:11434/api/chat

# OpenRouter (opcional - para Railway/Vercel sin Ollama)
# OPENROUTER_API_KEY=sk-or-v1-...

# Servidor local
PORT=3005

# Variables para el script de feedback
# FEEDBACK_AGENT_ID=11155111:2387
# FEEDBACK_PRIVATE_KEY=...
# FEEDBACK_VALUE=5
# FEEDBACK_TAG1=studio
# FEEDBACK_TAG2=videodanza
# FEEDBACK_ENDPOINT=https://my-agent-tau.vercel.app/.well-known/agent-card.json
```

### Configuración de Ollama (Local)
- **URL:** `http://127.0.0.1:11434/api/chat`
- **Modelo:** `qwen3.4:4b`
- **Temperatura:** 0.7
- **Max predict (tokens):** 2048

### Configuración de OpenRouter (Cloud)
- **URL:** `https://openrouter.ai/api/v1/chat/completions`
- **Modelo fallback:** `qwen/qwen-2.5-coder-32b-instruct`
- **HTTP Referer:** `https://videodanza.art`
- **X-Title:** `entropiav2`

---

## 7. Sistema de LLM Provider Abstraction

El agente implementa `callLLM()`, una capa de abstracción que soporta tres proveedores:

1. **Ollama (local):** Procesamiento privado, soberanía de datos. Default provider.
2. **OpenRouter:** Nube, modelos gratuitos/baratos (qwen 2.5 coder). Usado en Vercel.
3. **OpenAI:** Fallback.

```
usuario → callLLM(messages, stream?) → switch(LLM_PROVIDER)
  ├── ollama     → POST /api/chat con {model, messages, stream, options}
  ├── openrouter → POST /v1/chat/completions con {model, messages, temperature, max_tokens}
  └── openai     → POST /v1/chat/completions (similar a openrouter)
```

**System Prompt actual:**
Eres entropiav2, agente creativo de VideoDanza Generativa. Hablas espanol latino. Eres poeta y tecnico a la vez: exploras danza, blockchain, IA y arte generativo.

**Reglas clave del prompt:**
- **Modo principal:** Estudio creativo de VideoDanza. Sugiere semillas únicas.
- **Formato semilla:** `semilla: "palabra-emocion-movimiento-año"`
- **Mint vs. Contract:** Cuando usuario dice "mintear/acunar/mint" -> NO genera código, sugiere semilla.
- **Solo genera código Solidity si el usuario lo pide EXPLICITAMENTE** con frases como "crear contrato", "generar código", etc.
- **Nunca pedir la private key del usuario**.

---

## 8. Motor de Composición de VideoDanza Generativa

### Pool de Videos
- **he:** 1-20
- **she:** 21-40
- **hybrid:** 41-60
- **avatar:** 61-80

### Pool de Música
- **melancholic:** 1-4
- **joyful:** 5-8
- **abstract:** 9-12
- **ambient:** 13-16

### Blend Modes CSS
```
4': 'multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference', 'exclusion'
```

### Algoritmo de Composición Determinístico
```typescript
function generateComposition(params): CompositionResult
  seedInput = params.seed || `${params.mood}-${params.perspective}-${params.energy}-${params.gender}-${Date.now()}`
  hash = sha256(seedInput)
  
  gender = params.gender || 'hybrid'
  mood = params.mood || 'ambient'
  
  videoPool = VIDEO_POOL[gender]
  musicPool = MUSIC_TRACKS[mood]
  
  videoIds = [
    videoPool[hashToInt(hash[0:8]) % len(videoPool)],
    videoPool[hashToInt(hash[8:16]) % len(videoPool)],
    videoPool[hashToInt(hash[16:24]) % len(videoPool)],
  ]
  
  return {
    seed: hash[0:16],
    videoIds: unique(videoIds),
    musicTrack: musicPool[hashToInt(hash[24:32]) % len(musicPool)],
    blendMode: BLEND_MODES[hashToInt(hash[32:40]) % len(BLEND_MODES)],
    opacity: 0.3 + (hashToInt(hash[40:48]) % 70) / 100,
    scale: 0.8 + (hashToInt(hash[48:56]) % 40) / 100,
    rotation: hashToInt(hash[56:64]) % 360,
    description: "..."
  }
```

---

## 9. Templates de Smart Contracts Solidados

5 templates contratos openzeppelin v5 listos para usar con remplace de nombres:

### Tipos Soportados
| Tipo | Descripción | Características |
|------|-------------|-----------------|
| `nft` / `erc721` | Standard NFT | ERC721 + URIStorage + Enumerable + Ownable + userSeed + compositionHash |
| `dynamic_nft` | Dynamic NFT Evolutivo | 4 estados (Seed→Sprout→Bloom→Wither), evolve(), transfer lock |
| `token` / `erc20` | Token ERC-20 | Max supply, mint owner, burnable |
| `marketplace` | Marketplace Simple | Lists, buy, 2.5% fee, ReentrancyGuard |
| `dao` | DAO Simple | Proposals, voting, execution |

### Generación de Contratos
- **Keyword detection:** "crear contrato", "generar código", "solidity", "erc721", "erc20", "marketplace", "dao" etc.
- **Detección de tipo:** Por keywords en el mensaje del usuario.
- **No genera código cuando el usuario dice:** "mintear", "acuñar", "mint" (evita solapamiento con composiciones)

---

## 10. MCP Tools (5 Tools)

### Tool 1: chat
- **Nombre:** chat
- **Descripción:** Conversación con el agente creativo entropiav2.
- **Inputs:** { message: string }
- **Flujo:** generateResponse(message) → respuesta del LLM

### Tool 2: generate_composition
- **Nombre:** generate_composition
- **Descripción:** Genera una composición única de videodanza determinística.
- **Inputs:** { mood?, gender?, energy?, perspective?, seed? }
- **Flujo:** generateComposition(params) → CompositionResult { seed, videoIds, musicTrack, blendMode, opacity, scale, rotation, description }

### Tool 3: generate_contract
- **Nombre:** generate_contract
- **Descripción:** Genera código Solidity seguro para smart contracts usando OpenZeppelin.
- **Inputs:** { type: "nft"|"dynamic_nft"|"token"|"marketplace"|"dao", name: string }
- **Flujo:** generateContract(type, { name }) → código Solidity completo

### Tool 4: describe_nft
- **Nombre:** describe_nft
- **Descripción:** Genera una descripción poética para un NFT de videodanza.
- **Inputs:** { seed, token_id, video_count?, music_track?, blend_mode? }
- **Flujo:** generateNFTDescription(composition, tokenId) → descripción poética con 4 estados poéticos

### Tool 5: get_agent_info
- **Nombre:** get_agent_info
- **Descripción:** Obtiene información sobre el agente: capacidades, stack técnico y proyectos asociados.
- **Inputs:** {} (ninguno)
- **Respuesta:** { name, version, description, capabilities, stack, projects }

---

## 11. Endpoints A2A (JSON-RPC 2.0)

### Methods Soportados
| Method | Descripción | Params |
|--------|-------------|--------|
| `message/send` | Enviar mensaje al agente | `{ message: { role, parts }, configuration?: { contextId, streaming? } }` |
| `tasks/get` | Obtener estado de tarea | `{ taskId: string }` |
| `tasks/cancel` | Cancelar tarea en curso | `{ taskId: string }` |

### Detección de Intenciones
El sistema distingue automáticamente entre:
- **Mint/Composición:** "mintear", "acunar", "mint", "mi nft", "mi composicion", "mi pieza" → generateResponse (chat normal)
- **Smart Contract:** "crear contrato", "generar código", "solidity", "erc721", "erc20", "marketplace", "dao" → generateContract + AI explanation

### Estados de Tarea
- submitted → working → input-required → completed | failed | canceled

---

## 12. Scripts Disponibles

```json
{
  "build": "tsc",
  "register": "tsx src/register.ts",
  "start:a2a": "tsx src/a2a-server.ts",
  "start:mcp": "tsx src/mcp-server.ts",
  "give-feedback": "node scripts/give-feedback.mjs"
}
```

### Registro ERC-8004 (`npm run register`)
Flujo (usando agent0-sdk):
1. Lee el agent existente por AGENT_ID (11155111:2387) o crea uno nuevo
2. setA2A(endpoint)
3. setMCP(endpoint)
4. setTrust(true, true, true)
5. setActive(true)
6. agent.registerIPFS() → mint + upload + setAgentURI

### Feedback On-Chain (`npm run give-feedback`)
Envía reputación on-chain vía agent0-sdk:
- Valor default: 5
- Tags: `studio` y `videodanza`
- Endpoint: `https://my-agent-tau.vercel.app/.well-known/agent-card.json`

---

## 13. Decisiones Técnicas y Filosofía del Agente

### Decisiones Clave
| Aspecto | Decisión | Razón |
|---------|----------|-------|
| **LLM default:** | Ollama local | Soberanía de datos, procesamiento privado |
| **LLM cloud fallback:** | OpenRouter + qwen 2.5 coder | Gratuito/barato, no requiere GPU propia |
| **Estándar:** | ERC-8004 | Estandar on-chain para agentes (identidad + reputación) |
| **Video generativo:** | Determinístico (SHA256) | Misma semilla = misma composición, verificable |
| **Contratos:** | OpenZeppelin v5 | Estándar seguro, auditado |
| **Deploy:** | Vercel | Serverless, gratis (hobby tier), CDN global |

### Principios del Agente
1. **Soberanía de datos:** Ollama local por default, OpenRouter solo en prod.
2. **Creatividad determinística:** Cada semilla genera la misma composición, siempre.
3. **Privacidad:** No almacenar datos de usuario, conversaciones efímeras.
4. **Reproducibilidad:** Código, contratos y composiciones deben ser verificables.
5. **Seguridad:** Nunca pedir claves privadas ni ejecutar txs sin autorización explícita.

---

## 14. Historial de Commits Relevantes (Git)

```
8995d77: docs/prueba_onchain_x402_primera_llamada_pagada
e60c6c4: fix/premium_x402_deadlock_next_callback
4a90e1e: fix/premium_llm_timeout_settle_x402
c5ac83e: fix/commit_lockfiles_vercel_builds_reproducibles
6d1ebad: fix/x402_req_header_originalurl_polyfill
0e840c5: fix/x402_req_path_polyfill_vercel_serverless
7b50d2b: feat/x402_premium_composition_usdc_base_sepolia
2791074: chore/gitignore_feedback_wallet
7db46f6: feat/agente_revival_mcp_health_tia_style
233c483: feat: add onchain feedback tooling and refresh agent docs
11bd041: fix: require explicit contract intent in serverless A2A
ebc8339: fix: remove empty OASF endpoint to satisfy IA025
47e322b: chore: disable OASF skill and domain declarations
5e328ef: fix: align A2A discovery endpoint with agent-card path
b121097: fix: use valid OASF skills and domains for agent registration
20cb35f: fix: publish canonical A2A endpoint in agent metadata
e984725: feat: sync agent metadata and add onchain reputation panel
d2e730d: fix: agent system prompt - no more Solidity on mint requests, suggest seeds instead
f8634d8: feat: integrate entropiav2 agent as creative studio on /agent page
42c5aab: feat: entropiav2 agent v2.0 - VideoDanza generative composition engine + A2A/MCP serverless
```

El detalle técnico del revival del 8 oct 2026 (x402, lockfiles, feedback, ranking) vive en `skills/agente-ops-vercel-x402/SKILL.md`, secciones 3, 4 y 10.

---

## 15. Tests Verificados

Los scripts de test (`test-agent.ts`, `test-tools.ts`) verifican:

### Test de Agent (`test-agent.ts`)
- ✅ Generación de composición final
- ✅ Determinismo: misma semilla = misma composición
- ✅ Diferentes semillas = diferentes composiciones
- ✅ Generación de descripciones NFT poéticas
- ✅ Generación de contratos (dynamic_nft, nft)
- ✅ Todos los pools de género funcionan (he, she, hybrid, avatar)

### Test de Tools (`test-tools.ts`)
- ✅ 5 herramientas registradas correctamente
- ✅ generate_composition funciona con parámetros
- ✅ generate_contract con dynamic_nft, nft y tipo inválido
- ✅ describe_nft genera descripciones poéticas
- ✅ get_agent_info retorna metadata completa
- ✅ Error en herramienta desconocida

---

## 16. Guía Rápida: Comandos para El/La Desarrollador o Generativa

### Desarrollo Local
```bash
cd 8004/my-agent
npm install

# Local dev (Ollama + Express A2A server)
ollama run qwen3.4:4b    # Primero: pull/download modelo
OLLAMA_HOST=0.0.0.0:11434 ollama serve

# En otra terminal:
npm run start:a2a           # http://localhost:3000/a2a
npm run start:mcp           # stdio (para Claude Desktop)
```

### Deploy a Vercel
```bash
npm i -g vercel
vercel --prod

# Luego en dashboard Vercel agregar env vars
vercel env add LLM_PROVIDER production
vercel env add LLM_MODEL production
vercel env add OPENROUTER_API_KEY production
vercel env add PRIVATE_KEY production
vercel env add PINATA_JWT production
vercel env add RPC_URL production
```

### Registro On-Chain
```bash
# Asegúrate de tener private key con Sepolia ETH de test
cp .env.example .env
# Editar .env con tus credenciales

npm run register
```

### Verificar Post-Deploy
```bash
# Agent Card
curl https://my-agent-tau.vercel.app/.well-known/agent-card.json

# A2A Test
curl -X POST https://my-agent-tau.vercel.app/a2a \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"message/send","params":{"message":{"role":"user","parts":[{"type":"text","text":"Hola, quien eres?"}]}},"id":1}'
```

---

## 17. Recursos y Referencias Externas

- **ERC-8004 Specification:** https://eips.ethereum.org/EIPS/8004
- **Agent0 SDK:** https://sdk.ag0.xyz/
- **A2A Protocol:** https://a2a-protocol.org/
- **MCP (Model Context Protocol):** https://modelcontextprotocol.io/
- **8004scan Explorer:** https://www.8004scan.io/agents/sepolia/2387
- **OpenRouter:** https://openrouter.ai/
- **OpenZeppelin:** https://www.openzeppelin.com/contracts
- **ETHSkills (patrones):** https://ethskills.com/

---

## 18. Notas para el Agente (Contexto de Uso)

Esta skill es una referencia viva. Cuando se desarrollen nuevos features sobre entropiav2 (RAG, nuevos tools, nuevas integraciones), actualizar este archivo con las decisiones técnicas, cambios de arquitectura y aprendizajes.

**Mantenimiento recomendado:**
- Cada nuevo deploy de Vercel → verificar que endpoints funcionan
- Cada cambio de LLM → actualizar sección 7
- Cada nuevo tool → agregar en sección 10
- Cada nuevo tipo de contrato → agregar en sección 9
- Cada deploy en mainnet/production → documentar en historial
