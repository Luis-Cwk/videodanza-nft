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
2. **Registro oficial de MCP: estamos dentro y ya en el dominio propio.**
   `io.github.Luis-Cwk/entropiav2` **v2.0.1**, remoto `streamable-http` en
   `https://entropia.petrasynthetic.com/mcp`. La v2.0.0 (que apuntaba a
   `my-agent-tau.vercel.app`) quedó **deprecada** el 2026-11-04. Las versiones
   del registro son inmutables: para cambiar algo hay que subir de versión.
3. **x402scan: registrado el 2026-11-05.** Se publicó `/openapi.json` con
   `x-payment-info` en las dos rutas pagadas y el 402 ahora manda
   `WWW-Authenticate: x402`. El registro leyó el OpenAPI y dio de alta 2 de 2
   recursos pagados. Ficha: `x402scan.com/server/53a50333-c4f9-4eb0-ae5b-e45162cb47b9`.
   Escaparate: `tryponcho.com/m/entropia.petrasynthetic.com`.
4. **Agentic.Market: SÍ estamos listados**, con las tres rutas. Verificado el
   2026-11-06 contra su API real (`https://api.agentic.market/v1/services/search?q=entropia`),
   que devuelve el servicio `entropia.petrasynthetic.com` en `eip155:8453` con
   `agent-check` 0.02, `premium-composition` 0.1 y `prompt/analyze` 0.02. Ficha:
   `agentic.market/services/entropia-petrasynthetic-com`.
   OJO, para no repetir el error: la API vive en el subdominio `api.`, no en el
   dominio raíz, y el slug de la ficha es el dominio con guiones, no el
   `serviceName`. Leer `agentic.market/SKILL.md` antes de comprobar nada.
5. Glama y PulseMCP: Glama devuelve la búsqueda vacía (la coincidencia era el
   cuadro de texto) y PulseMCP responde 403. No estamos o no se puede comprobar.
6. Polygon Agentic Services: pendiente, y solo si se acepta USDC en Polygon.

**MCPTRY (2026-11-05):** estamos listados y `Working`, puesto 410 de 2650 en
Diseño y Creatividad con 84/100. Da +4 por icono (hecho, v2.0.2) y +2 por
anotaciones `readOnlyHint` (hecho, en las 11 tools). El "reclamo" con GitHub no
se hizo: el dominio se registró el 2026-10-23 y no vale un OAuth a un sitio de
dos semanas por 5 puntos y una insignia.

**Dominio canónico: `entropia.petrasynthetic.com`** (decisión de Petra). El agent
card, el contrato, las tools del MCP y el registro oficial ya lo usan. En el
Bazaar conviven la entrada del dominio propio y la vieja de `my-agent-tau`, que
quedó sin tráfico y se irá hundiendo sola; no hay forma de borrarla desde fuera.

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

1. **Movimiento a estructura tipada: DESCARTADA el 2026-11-05.** Se midió antes de
   construir. MediaPipe pose lite sobre tres clips reales: 0.95x, 1.99x y 1.74x
   respecto a tiempo real en CPU, y solo 33-40% de frames con pose detectada. Dos
   problemas: no cabe en serverless y la cobertura es demasiado baja, incluso con
   material propio renderizado. El contrato queda en `CONTRATO-MOVIMIENTO.md` como
   registro de la medición, no como trabajo pendiente.
2. Pose como servicio con esquema versionado.
3. Coreografía determinista por semilla.
4. Retargeting entre rigs.
5. Atestación de medios sintéticos (necesita verificador público antes de cobrar).
6. Lote con manifiesto.

Antes de elegir la siguiente: mirar qué se vende de verdad en el ecosistema (top de
x402scan y del ranking de MCPTRY en Diseño y Creatividad) en vez de inventar una
capacidad y esperar demanda.

## Cómo se mide

Por ruta: llamadas pagadas, ingreso, compradores que repiten. El Bazaar ya publica
`l30DaysTotalCalls` y `l30DaysUniquePayers` por recurso: esa es la fuente.
Una ruta sin pagos repetidos a las cuatro semanas se apaga.

## Pendiente fuera de este plan

La rama `feat/entropia-escrow` de `videodanza-nft` está divergida del remoto y
tiene ~90 archivos sin commitear de otras sesiones. Además, `api/agent-check.ts`,
`src/agent-check.ts` y `src/cdp-auth.ts` **nunca se han commiteado**: viven solo en
el árbol local. Cualquier clon del remoto no tiene el endpoint pagado.

## Siguiente paso acordado: ruta del prompt (2026-11-06)

Todo lo caro ya esta probado. No volver a medirlo.

**Mercado.** La pregunta de la industria es 'cual es el prompt'. En MCPTRY hay 5 servidores de prompts y solo 1 funciona como servicio remoto (GPT Image Hub, que es una biblioteca, no imagen a prompt). El hueco existe.

**Metadatos.** 0 de 120 imagenes propias traen el prompt embebido. Nunca prometer recuperacion exacta.

**Vision.** Qwen3-VL-235B describe bien encuadre, gesto, luz, medio y camara. Cuesta \.0012 por llamada. Gemini 2.5 flash lite falla en el encuadre: dice 'centrado' cuando el sujeto esta a la derecha.

**Reproduccion.** Falla, y no por el prompt: con el prompt correcto el generador derrite la pose. La promesa viable es 'el prompt que describe esta imagen', no 'la copia'.

**Precio.** 2 centavos, igual que el lider del mercado.

**A construir:** POST /v1/prompt/analyze con image_url; salida estructurada (framing, gesture, light, palette, medium, camera, prompt, negative, confidence); modelo qwen/qwen3-vl-235b-a22b-instruct; gratis con tope y pagado arriba.
