# Deploy en Vercel - entropiav2

## Opción A: Deploy desde CLI (recomendado)

```bash
cd C:\Users\petra\videodanza-nft\8004\my-agent

# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Login
vercel login

# Deploy (primera vez)
vercel --prod

# Configurar variables de entorno
vercel env add LLM_PROVIDER production
vercel env add LLM_MODEL production
vercel env add OPENROUTER_API_KEY production
vercel env add PRIVATE_KEY production
vercel env add PINATA_JWT production
vercel env add RPC_URL production
```

## Opción B: Deploy desde GitHub

1. Ve a https://vercel.com/new
2. Importa tu repo de GitHub
3. Selecciona el directorio `8004/my-agent` como root
4. Configura las variables de entorno en el dashboard de Vercel
5. Deploy automatico en cada push

## Variables de Entorno (en dashboard de Vercel)

```
LLM_PROVIDER=openrouter
LLM_MODEL=qwen/qwen-2.5-coder-32b-instruct
OPENROUTER_API_KEY=sk-or-v1-...
PRIVATE_KEY=0xb4a04bd83346a2a9c110cf9e233766e438582e7de798c4b5f4c03b9df2b2d298
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
```

## Endpoints despues del deploy

Vercel te da una URL como: `https://entropiav2.vercel.app`

Los endpoints del agente son:
- Agent Card: `https://TU-URL/.well-known/agent-card.json`
- A2A: `https://TU-URL/a2a`
- MCP: `https://TU-URL/mcp`

## Re-registrar el agente

Una vez tengas la URL de Vercel:

```bash
cd C:\Users\petra\videodanza-nft\8004\my-agent

A2A_ENDPOINT=https://TU-URL/.well-known/agent-card.json \
MCP_ENDPOINT=https://TU-URL/mcp \
npm run register
```

## Verificar en 8004scan

https://www.8004scan.io/agents/sepolia/{agentId}

## Probar el agente

```bash
# Agent Card
curl https://TU-URL/.well-known/agent-card.json

# Enviar mensaje
curl -X POST https://TU-URL/a2a \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "message/send",
    "params": {
      "message": {
        "role": "user",
        "parts": [{"type": "text", "text": "Hola, quien eres?"}]
      }
    },
    "id": 1
  }'
```

## Costos

- Vercel Hobby: **Gratis** (100GB bandwidth, serverless functions incluidas)
- OpenRouter: ~$0.01-0.05/mes con uso normal (qwen 2.5 coder es muy barato)
- Gas Sepolia: gratis (testnet)

## Arquitectura

```
Usuario/Otro Agente
       ↓
   Vercel Edge (HTTPS)
       ↓
   Serverless Functions
   ├── GET  /.well-known/agent-card.json  → Agent Card
   ├── POST /a2a                          → A2A JSON-RPC
   └── POST /mcp                          → MCP JSON-RPC
       ↓
   OpenRouter API (LLM qwen 2.5)
```

Tu maquina local NUNCA se expone. Todo corre en Vercel.
