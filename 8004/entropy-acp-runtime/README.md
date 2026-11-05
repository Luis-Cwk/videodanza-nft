# Entropy ACP runtime

Runtime propio de Entropy para el marketplace ACP de Virtuals. Usa la CLI oficial `@virtuals-protocol/acp-cli` y el signer guardado en el keychain del sistema.

## Requisitos

- Node.js 18 o superior.
- CLI instalada: `npm i -g @virtuals-protocol/acp-cli`.
- Sesión autenticada: `acp configure`.
- Signer aprobado para Entropy: `acp agent add-signer --agent-id 01a16777-0f37-71d6-b2af-ebc5d6019abf --policy restricted`.
- Agente activo correcto antes de arrancar:

```bash
acp agent use --agent-id 01a16777-0f37-71d6-b2af-ebc5d6019abf
acp agent whoami
```

## Arranque

```bash
npm start
```

El worker consulta `acp job list` cada 5 segundos. Cuando un job está en `OPEN`, propone el presupuesto de la oferta. Cuando está en `FUNDED`, genera el entregable y lo envía con `acp provider submit`.

Para una sola pasada:

```bash
npm run once
```

## Variables

| Variable | Default | Uso |
|---|---|---|
| `ACP_CHAIN_ID` | `8453` | Chain de los jobs. |
| `ACP_POLL_MS` | `5000` | Intervalo de consulta. |
| `ACP_AGENT_WALLET` | wallet de Entropy | Wallet que debe estar activa. |
| `ACP_TEST_JOB_IDS` | `82136` | Jobs de prueba con precio cero. |
| `ACP_FALLBACK_PRICE` | `0` | Precio cuando no se identifica la oferta. |
| `ACP_LLM_MODEL` | `meta/llama-3.2-90b-vision-instruct` | Modelo de NVIDIA para los entregables. |
| `ACP_LLM_TIMEOUT_MS` | `180000` | Timeout de la llamada al modelo. |
| `NVIDIA_API` y `NVIDIA_URL` | se leen de `../my-agent/.env` | Credenciales del modelo. |

## Entregables reales

El worker genera los entregables con el modelo de NVIDIA y cae a la plantilla determinista si la llamada falla. Para probar las cuatro ofertas sin tocar ACP:

```bash
npm run selftest
```

## Prueba realizada

Job `82136` en Base. Cliente temporal `Entropy Test Client` (`0xe6b3e4b21838c777c06511b2c3f19dac52211813`), proveedor Entropy (`0x2200cdf7512833a9b37ef5ac136f135398c0045c`). Presupuesto 0 USDC, sin movimiento de fondos. El worker toma el job en `FUNDED` y entrega un JSON de prueba.

## Límites

- El runtime corre en la máquina donde está el keychain. Para producción hay que moverlo a un servidor que pueda mantener el proceso y el signer, o usar el flujo headless de partner de Virtuals.
- La wallet de Entropy está en 0 USD. Un job real necesita que el cliente fondee el escrow.
- Los entregables usan el modelo de NVIDIA y caen a una plantilla determinista si la llamada falla. Ajustar los prompts en `buildPrompt` cuando cambie el brief de una oferta.
