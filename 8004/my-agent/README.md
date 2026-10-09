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

## Endpoint premium x402 (estilo TIA)

`GET /v1/premium-composition` cobra $0.10 USDC en Base Sepolia por llamada, sin API key.

```bash
# Sin pago regresa 402 con los requisitos en el body
curl -i "https://my-agent-tau.vercel.app/v1/premium-composition?seed=cuerpo-en-orbita&token_id=42"

# Con pago: cliente x402 firma USDC y reintenta con header X-PAYMENT
# (x402-fetch en TypeScript)
```

PayTo: `0x6bce199069a02917114dd8a9bdca5e6886f2afaa` (wallet del agente).
Facilitator: `https://x402.org/facilitator` (testnet).
Configurable via env `X402_PAY_TO`.

Primera llamada pagada verificada (Oct 8 2026):
tx `0xb63c10b60ef17ce33eae03e789434fcab14fd60496eb2f8f672996f49c19d75c` en Base Sepolia,
0.10 USDC, payer `0x9732...DD13`, recibo `success: true` en header `X-PAYMENT-RESPONSE`.

Gotcha serverless: el cuerpo del handler debe correr DENTRO del callback
`next()` de `paymentMiddleware`. Correrlo despues de `await middleware(...)`
causa deadlock (el middleware espera `res.end()` para hacer settle) y la
funcion muere a los 60s con 504 sin liquidar el pago.

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

- `GET /mcp` responde 200 con info del servidor y lista de tools. `POST /mcp` ejecuta JSON-RPC (`initialize`, `tools/list`, `tools/call`, `ping`).
- `GET /health` responde 200 gratis con estado, version y endpoints, al estilo TIA para chequeos de agentes y 8004scan.
- A2A se publica para discovery en `/.well-known/agent-card.json`.
- El registro se actualiza sobre el agente existente (`2387`) para mantener continuidad reputacional.
