# Plan para que entropiav2 se pueda contratar

Estado al 2026-11-04, actualizado tras el trabajo de hoy. Orden de Petra: primero
descubrimiento (7, 8, 9, 10, 11, 12), después capacidades (1 a 6).

Regla que manda todo: máximo tres rutas pagadas. El dato de NetIntel es 5 endpoints
haciendo el 75% del ingreso y 69 de 74 sin facturar. Nada de menú.

## Lo que ya existe

| Pieza | Estado | Nota |
|---|---|---|
| `/v1/agent-check` | vivo, 402, **indexado en el Bazaar** | x402 v2, Base mainnet, $0.02. 6 llamadas y 5 pagadores únicos en 30 días |
| `/v1/agent-check/preview` | **vivo, gratis** (nuevo hoy) | Veredicto, banda de score y códigos de banderas. Sin desglose |
| `/v1/contract` | **vivo** (nuevo hoy) | Versión, rutas, precios, esquemas y changelog |
| `/v1/premium-composition` | vivo, 402, **indexado en el Bazaar** | x402 v1, $0.10, default base-sepolia. 3 llamadas y 2 pagadores en 30 días |
| `/mcp` | vivo | 9 tools, incluida `composicion_premium` |
| `/a2a`, agent card, registration, `/health` | vivos | |

Las dos rutas pagadas aparecen en el Bazaar bajo **`my-agent-tau.vercel.app`**, no
bajo `entropia.petrasynthetic.com`.

## Correcciones a la auditoría anterior

1. **Sí estamos en el Bazaar.** El primer barrido revisó 20,000 entradas y el
   catálogo tiene más de 40,000. Las nuestras están más allá del corte. Barrido
   completo con agujas precisas: aparecen las dos.
2. **La primera página del catálogo no está ordenada por `lastUpdated`.** Sirve
   para nada como verificación rápida. Hay que barrer.
3. **El facilitador de CDP no estaba configurado.** En producción
   `X402_FACILITATOR_URL`, `CDP_API_KEY_ID` y `CDP_API_KEY_SECRET` estaban
   **vacías**; el código caía a `x402.org/facilitator`. Se conectaron hoy con las
   llaves de `.cdp-keys.json`. Ojo: al subirlas con la CLI de Vercel hay que
   normalizar saltos de línea (`\r\n` a `\n` y `trim`), o el facilitador revienta
   con 500.

## Hecho hoy

- Fondeo del comprador: 0.03 USDC desde la agentWallet. Tx `0x56fd9a7e…`.
- Dos pagos liquidados en Base: `0x05812272…` (0.02) y `0x26f2eb00…` (0.02).
- Facilitador de CDP conectado y redesplegado.
- `/v1/agent-check/preview` y `/v1/contract` desplegados y verificados en los dos
  hosts. Prueba de humo en `scripts/_smoke-endpoints.ts` (`npx tsx`).
- `pay-agent-check.mjs` acepta una wallet como cuarto argumento.

## Fase 1: descubrimiento

### 7. Endpoint gratis real — HECHO

`GET /v1/agent-check/preview?chain=&agent_id=`. Devuelve veredicto, banda de score
y códigos de banderas; retiene score exacto, servicios, metadata, reputación,
wallet y el mensaje de cada bandera. Límite de 20 por IP y día, en memoria: es
best-effort, se reinicia en frío, y así se declara en la respuesta.

### 8. Paridad de metadata — PENDIENTE (decisión)

Dos versiones de x402 conviviendo. `premium-composition` es v1 y su default es
testnet. O migra a v2, o se retira. Recomendación: retirarla, tiene 3 llamadas y
un pago de prueba.

### 9. Registro en los cinco lugares — A MEDIAS

1. Bazaar de CDP: **hecho**, las dos rutas.
2. **Registro oficial de MCP: estamos dentro** desde el 2026-10-17, como
   `io.github.Luis-Cwk/entropiav2` v2.0.0, remoto `streamable-http`. Pero apunta a
   `my-agent-tau.vercel.app`: hay que republicarlo con el dominio bueno.
3. Agentic.Market: sin verificar. Sus rutas de API (`/v1/services`,
   `/api/services`) devuelven 404 y `/api/markdown` es un índice de documentación.
4. x402scan: sin verificar. `/api/resources` y `/api/v1/resources` devuelven 404.
5. Glama y PulseMCP: Glama devuelve la búsqueda vacía (la coincidencia era el
   cuadro de texto) y PulseMCP responde 403. No estamos o no se puede comprobar.
6. Polygon Agentic Services: pendiente, y solo si se acepta USDC en Polygon.

**Dominio canónico: `entropia.petrasynthetic.com`** (decisión de Petra). El agent
card y el contrato ya lo usan. Quedan dos cosas apuntando al viejo:
- El registro de MCP, que necesita republicación.
- Las entradas del Bazaar, que se crearon con pagos contra el host de Vercel. Para
  moverlas hay que pagar al menos una vez contra el dominio propio.

### 10. Contrato visible — HECHO (sin uptime)

`GET /v1/contract` con versión, rutas, precios, redes, esquemas, política de
versiones y changelog. `uptime.measured` es `false` a propósito: no hay monitor
externo y no se publica un número que no se mide.

### 11. Llegar a 10 feedbacks — PENDIENTE

Mainnet está en 5. Con 10 se pasa de Established a Trusted.

### 12. Paridad MCP y A2A — HECHO

El MCP pasó de 9 a 11 tools: `agent_check` (pagada, proxy al endpoint HTTP con el
header `X-PAYMENT`) y `agent_check_preview` (gratis). El card de A2A declara 11
skills, incluida `agent_due_diligence_preview`. Ambas tools son proxy al endpoint
HTTP, así que heredan el facilitador correcto en vez de reimplementar el cobro.

Prueba de humo: `npx tsx scripts/_smoke-mcp.ts`.

## Fase 2: capacidades (1 a 6)

No se empieza hasta que la fase 1 esté medida.

1. Movimiento a estructura tipada.
2. Pose como servicio con esquema versionado.
3. Coreografía determinista por semilla.
4. Retargeting entre rigs.
5. Atestación de medios sintéticos (necesita verificador público antes de cobrar).
6. Lote con manifiesto.

## Cómo se mide

Por ruta: llamadas pagadas, ingreso, compradores que repiten. El Bazaar ya publica
`l30DaysTotalCalls` y `l30DaysUniquePayers` por recurso: esa es la fuente.
Una ruta sin pagos repetidos a las cuatro semanas se apaga.

## Pendiente fuera de este plan

La rama `feat/entropia-escrow` de `videodanza-nft` está divergida del remoto y
tiene ~90 archivos sin commitear de otras sesiones. Además, `api/agent-check.ts`,
`src/agent-check.ts` y `src/cdp-auth.ts` **nunca se han commiteado**: viven solo en
el árbol local. Cualquier clon del remoto no tiene el endpoint pagado.
