# entropiav2 (ERC-8004 Agent)

Agente creativo para VideoDanza Generativa. Soporta A2A y MCP sobre Sepolia, con registro ERC-8004 activo.

## Estado actual

- Agent ID: `11155111:2387`
- Explorer: `https://www.8004scan.io/agents/sepolia/2387`
- Agent card: `https://my-agent-tau.vercel.app/.well-known/agent-card.json`
- A2A endpoint: `https://my-agent-tau.vercel.app/a2a`
- MCP endpoint: `https://my-agent-tau.vercel.app/mcp`

## Requisitos

- Node.js 18+
- Wallet Sepolia con ETH para gas
- Variables en `.env`

```env
PRIVATE_KEY=0x...
PINATA_JWT=...
RPC_URL=https://ethereum-sepolia-rpc.publicnode.com

# LLM
LLM_PROVIDER=openrouter
LLM_MODEL=qwen/qwen3-coder:free
OPENROUTER_API_KEY=...

# Opcional
AGENT_ID=11155111:2387
AGENT_BASE_URL=https://my-agent-tau.vercel.app
```

## Scripts

```bash
npm install
npm run build
npm run register
npm run start:a2a
npm run start:mcp
npm run give-feedback
```

## Probar MCP rápido

```bash
curl -X POST https://my-agent-tau.vercel.app/mcp \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}"
```

## Script para feedback on-chain

Este repo incluye `scripts/give-feedback.mjs` para que testers suban reputación real.

Variables opcionales para el script:

```env
FEEDBACK_AGENT_ID=11155111:2387
FEEDBACK_PRIVATE_KEY=0x...
FEEDBACK_VALUE=5
FEEDBACK_TAG1=studio
FEEDBACK_TAG2=videodanza
FEEDBACK_ENDPOINT=https://my-agent-tau.vercel.app/.well-known/agent-card.json
FEEDBACK_REASON=Probado flujo A2A/MCP + estudio creativo. Buena experiencia.
```

Ejecutar:

```bash
npm run give-feedback
```

## Notas de operación

- `GET /mcp` devuelve `405 Method not allowed` por diseño. MCP usa `POST` JSON-RPC.
- A2A se publica para discovery en `/.well-known/agent-card.json`.
- El registro se actualiza sobre el agente existente (`2387`) para mantener continuidad reputacional.
