# Skill: Operaciones del Agente entropiav2 (Vercel + x402 + ERC-8004)

Skill operativa creada el 8 de octubre de 2026 tras el revival completo del agente
entropiav2 (Sepolia 2387). Contiene las reglas para que los deploys de Vercel de
este repo NO vuelvan a fallar, el flujo x402 probado de punta a punta, y todos
los gotchas de blockchain, RPC y 8004scan descubiertos en campo.

Regla de oro: antes de tocar el agente o el frontend, leer este archivo completo.

---

## 1. Mapa de deploys de Vercel (CRITICO, no fallar de nuevo)

Este repo (`Luis-Cwk/videodanza-nft`, rama `master`) alimenta DOS proyectos Vercel
con comportamientos DISTINTOS:

| Proyecto Vercel | Root | Trigger | URL produccion |
|---|---|---|---|
| `videodanza-nft` (frontend Next.js 14) | `frontend/` | **Git: cada push a master despliega** | https://videodanza-nft.vercel.app |
| `my-agent` (agente ERC-8004) | `8004/my-agent/` | **Solo CLI manual: `npx vercel --prod --yes`** | https://my-agent-tau.vercel.app |

Consecuencias:
1. CUALQUIER push a master (aunque solo toque `8004/my-agent/`) dispara un build
   del frontend. Verificar SIEMPRE el estado del deploy del frontend despues de
   cada push, no solo el del agente.
2. Los cambios del agente NO se despliegan con push: hay que correr
   `npx vercel --prod --yes` dentro de `8004/my-agent/`.
3. Un deploy fallido NO tira produccion: la ultima version READY sigue sirviendo.

### Reglas anti-fallo de deploy (obligatorias)

1. **Lockfiles commiteados.** `frontend/package-lock.json` y
   `8004/my-agent/package-lock.json`estan en git (negaciones en `.gitignore` raiz).
   NUNCA volver a ignorar lockfiles. Sin lockfile, Vercel resuelve dependencias
   desde cero en cada build y el drift de versiones rompe webpack.
   - Caso real (8 oct 2026): 6 builds seguidos fallaron porque
     `@coinbase/cdp-sdk` (cadena: rainbowkit -> wagmi -> @wagmi/connectors ->
     @base-org/account -> cdp-sdk) salto a 1.58.0, que importa `@x402/evm/upto/client`,
     `@x402/core/client` y `@x402/svm/exact/client`, paquetes que no se instalan.
     Fix: commit `c5ac83e` commiteo los lockfiles (cdp-sdk queda clavado en 1.44.1).
2. **Build local antes de push.** Si se toca `frontend/`, correr
   `cd frontend && npm run build` y exigir exit 0 ANTES de pushear.
   Si se toca `8004/my-agent/`, correr `cd 8004/my-agent && npm run build` (tsc).
3. **Si se edita un package.json**, regenerar su lockfile en la misma sesion:
   `npm install` (o `npm install --package-lock-only`) y commitear AMBOS archivos.
4. **No mezclar**: los commits del agente y del frontend pueden ir juntos, pero
   verificar los DOS proyectos despues del push:
   ```powershell
   # estados de deploy via MCP vercel (list_deployments por projectId)
   # frontend: prj_hrqE8ac95yRFfS2FhXopBryZYqPS
   # my-agent: prj_9cMMCe8s2pfuGInLLDmDCawMkXHz (team_5f8AleJtmP0b5A6AA8gxTeVv)
   ```
5. **Diagnosticar fallos con logs reales**, no adivinando:
   ```powershell
   # logs de runtime (errores de funcion, 500/504):
   npx vercel logs <url-o-id-del-deployment>
   # build logs de un deployment fallido:
   npx vercel inspect <deployment-id>
   ```
   En Windows el comando `vercel logs` se queda colgado escuchando: lanzarlo con
   Start-Process + timeout + Stop-Process, o redirigir a archivo y leerlo.

---

## 2. Agente entropiav2: endpoints en produccion

Base: `https://my-agent-tau.vercel.app` (proyecto Vercel `my-agent`, alias `my-agent-tau`).

| Endpoint | Metodo | Precio | Funcion |
|---|---|---|---|
| `/.well-known/agent-card.json` | GET | Gratis | Discovery A2A, 4 skills |
| `/a2a` | POST | Gratis | JSON-RPC A2A: message/send, tasks/get, tasks/cancel |
| `/mcp` | GET | Gratis | Info del server MCP, lista de tools, status healthy |
| `/mcp` | POST | Gratis | JSON-RPC MCP: initialize, tools/list, tools/call, ping |
| `/health` | GET | Gratis | Estado estilo TIA: agentId, version, endpoints, pricing |
| `/v1/premium-composition` | GET | **$0.10 USDC Base Sepolia (x402)** | Composicion premium + texto curatorial |

Importante para 8004scan: `GET /mcp` DEBE responder 200. Su health checker hace
GET; si responde 405 marca el servicio unhealthy, `integrity_tier: broken` y
clava el score en el piso (banda 5 a 15). El POST sigue siendo el JSON-RPC real.

### Identidad onchain

| Dato | Valor |
|---|---|
| Agent ID | `11155111:2387` (Sepolia) |
| Owner / agentWallet | `0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa` |
| Identity Registry Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Reputation Registry Sepolia | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Explorer | https://testnet.8004scan.io/agents/sepolia/2387 |
| Metadata IPFS (oct 2026) | `ipfs://bafkreifse2ewnhrxmd47p5yw6vk7b67anrtwaeeeasnmnbmslrlpgsb3ui` |
| Wallet de feedback/tester | `0x9732e0f07b17b1360d15F2456FC5f2Baf858DD13` (llave en `8004/my-agent/.feedback-wallet.json`, gitignored) |

OJO: el Reputation Registry de Sepolia (`0x8004B663...8713`) es DISTINTO al de
mainnet (`0x8004BAa1...9b63`). No confundirlos.

---

## 3. Flujo x402 completo (probado de punta a punta el 8 oct 2026)

Modelo copiado de TIA (https://stellar.holatia.app/): pago por llamada, sin
cuentas ni API keys, con prueba onchain publicada en la landing.

### Servidor (x402-express v1.2.0, API V1)

```ts
import { paymentMiddleware } from 'x402-express';

const middleware = paymentMiddleware(
  PAY_TO,                       // wallet que recibe
  {
    'GET /v1/premium-composition': {
      price: '$0.10',
      network: 'base-sepolia',  // formato V1 (string), no eip155:84532
      config: { description: '...' },
    },
  }
  // facilitator default: https://x402.org/facilitator (testnet, sin key)
);
```

### GOTCHAS DE SERVERLESS (aprendidos con 504s reales)

1. **DEADLOCK (el bug gordo).** `paymentMiddleware` verifica el pago, llama
   `next()` y despues ESPERA `res.end()` (endPromise interno) para liquidar
   (settle) onchain y volcar el buffer con el header `X-PAYMENT-RESPONSE`.
   En Express, next() encadena al route handler de forma independiente. En una
   serverless function de Vercel, si el cuerpo corre DESPUES de
   `await middleware(req, res, () => {})`, hay deadlock: el middleware espera
   res.end() y el handler espera al middleware. Resultado: timeout de 60s, 504,
   pago sin liquidar. **El cuerpo del handler DEBE correr DENTRO del callback de
   next()**, y SIEMPRE terminar la respuesta (res.json o res.status(500).json),
   incluso en errores, o el settle queda colgado:
   ```ts
   await middleware(req, res, () => {
     servePremium(req, res).catch((err) => {
       if (!res.writableEnded) res.status(500).json({ error: err.message });
     });
   });
   ```
   Si la respuesta termina con statusCode >= 400, el middleware NO liquida
   (no cobra). Comportamiento deseado.

2. **Polyfills de Express.** Vercel serverless no expone `req.path`,
   `req.protocol`, `req.originalUrl` ni `req.header(name)`. Sin polyfill:
   `TypeError: Cannot read properties of undefined (reading 'split')` y
   `req.header is not a function` -> FUNCTION_INVOCATION_FAILED. Polypillear
   los cuatro ANTES de llamar al middleware (ver `api/premium-composition.ts`).

3. **Presupuesto de tiempo.** maxDuration maximo en Hobby: 60s. El flujo pagado
   completo es: verify (facilitator, ~1s) + handler + settle (tx onchain, ~2-5s).
   Cualquier LLM dentro del handler DEBE tener timeout propio (usamos
   Promise.race con 12s y fallback determinista). Funcion que muere a los 60s =
   cliente cobrado en el limbo (aunque en la practica el settle no corre y no
   se cobra, el pago queda sin datos).

### Cliente (x402-fetch v1.2.0)

```js
const { wrapFetchWithPayment, decodeXPaymentResponse, createSigner } =
  await import('x402-fetch');

// GOTCHAS: createSigner es ASYNC (devuelve promesa, hay que await)
// y toma el nombre de red V1 ('base-sepolia'), NO 'evm'.
const signer = await createSigner('base-sepolia', privateKey);
const fetchWithPayment = wrapFetchWithPayment(fetch, signer);
const res = await fetchWithPayment(urlPagado);
const receipt = decodeXPaymentResponse(res.headers.get('x-payment-response'));
// receipt: { success, network, transaction (tx hash), payer }
```

- El payer NO necesita ETH: el esquema exact usa EIP-3009
  (transferWithAuthorization), el facilitador paga el gas y retransmite.
- Pago de un solo uso: el nonce EIP-3009 se consume onchain; replay falla.
- USDC Base Sepolia para probar: https://faucet.circle.com (requiere login
  humano). Sin captcha headless conocido a la fecha.

### Prueba onchain de referencia (primera llamada pagada, 8 oct 2026)

- Tx: `0xb63c10b60ef17ce33eae03e789434fcab14fd60496eb2f8f672996f49c19d75c`
  (Base Sepolia, bloque 47876441, 0.10 USDC, payer `0x9732...DD13`,
  payTo `0x6bce...faa`, recibo success:true, HTTP 200 en 6.4s).
- USDC Base Sepolia: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimales).
- RPC Base Sepolia: `https://sepolia.base.org`.

---

## 4. Feedback onchain (reputacion ERC-8004)

Reglas del estandar: el feedback DEBE venir de una wallet distinta al owner del
agente (el owner no puede autoevaluarse). Usar la wallet de tester.

### GOTCHA de gas en agent0-sdk v1.4.2 (reverts silenciosos)

`sdk.giveFeedback()` hardcodea `gasLimit: 300000`, pero la llamada real gasta
727k a 826k gas (strings largos: endpoint URL + feedbackURI ipfs). La tx se
mina con status `reverted` SIN razon visible, y `eth_call` simulado pasa
(no usa el mismo limite), lo que confunde el diagnostico.

Workaround probado (tx exitosa `0x816cbc...e105`):

```js
const data = encodeFunctionData({
  abi: [{ type:'function', name:'giveFeedback', stateMutability:'nonpayable', inputs:[
    {name:'agentId',type:'uint256'},{name:'value',type:'int128'},{name:'valueDecimals',type:'uint8'},
    {name:'tag1',type:'string'},{name:'tag2',type:'string'},{name:'endpoint',type:'string'},
    {name:'feedbackURI',type:'string'},{name:'feedbackHash',type:'bytes32'}], outputs:[] }],
  functionName: 'giveFeedback',
  args: [2387n, 5n, 0, tag1, tag2, endpointUrl, feedbackUri, feedbackHash],
});
const est = await publicClient.estimateGas({ to: REPUTATION_SEPOLIA, data, from });
await walletClient.sendTransaction({ to: REPUTATION_SEPOLIA, data, gas: est * 13n / 10n });
```

- Selector: `0x3c036a7e`. value es int128, decimals uint8.
- El primer feedback subio `total_feedbacks` en 8004scan en minutos.
- El segundo feedback uso un feedbackURI placeholder y quedo con parse warning:
  SIEMPRE subir el archivo de razones a Pinata primero y usar ese CID real.

---

## 5. Ranking de 8004scan (como se calcula y sus caches)

Algoritmo `v5_leaderboard_policy` (version 5.2), peso: 85% prueba (evidence),
15% soporte. Dimensiones: service (25%), engagement (30%), publisher (20%),
compliance (15%), momentum (10%).

Claves para el score:
- `feedback_count` y valor promedio: sin feedback onchain no hay evidence
  (`evidence_tier: early`, `proof_score: 0`).
- Salud de endpoints: health check propio con GET a los endpoints declarados.
  Un servicio declarado caido => `integrity_tier: broken` + banda de score 5 a 15
  (piso). Por eso GET /mcp debe responder 200.
- Metadata completa (tags, imagen http valida, descripcion) => compliance.
  La imagen debe ser URL directa (svg/png), NO un link a x.com ni data: URIs
  gigantes.
- engagement: stars, views, chats desde la UI de testnet.8004scan.io.
- Verificacion de dominio: con hosting de terceros (vercel.app) la verificacion
  se marca `skipped` (Third-party hosting domain). Un dominio propio lo resuelve.
- **Caches:** el health check corre en ciclo diario (~19:35 UTC observado);
  los mensajes dicen "(cached)" hasta el siguiente chequeo. El rescoring de
  feedback es mas rapido (minutos). Testnet rankea aparte de mainnet:
  testnet.8004scan.io/leaderboard (Sepolia, Base Sepolia, etc.).

API publica util (sin key, rate limited):
```
GET https://api.8004scan.io/api/v1/agents/11155111/2387
```
Devuelve rank, scores, breakdown completo, health por servicio y metadata.
Es LA fuente de verdad para verificar mejoras, mas confiable que la UI.

---

## 6. RPCs publicos y pruned history (frontend)

Error real visto en la pagina del agente:
`code 4444 "pruned history unavailable"` en `eth_getLogs` con rangos de 45000
bloques sobre `ethereum-sepolia.publicnode.com` (ethers v6 lo reporta como
"could not coalesce error").

Reglas:
1. Los RPC publicos podan historial de logs (publicnode Sepolia conserva poco
   rango). NUNCA hacer `queryFilter`/`getLogs` de un tiron sobre 100k+ bloques.
2. Patron correcto (implementado en `frontend/app/api/onchain-activity/route.ts`):
   chunks de <= 45000 bloques, iterados del MAS NUEVO al mas viejo, try/catch
   por chunk (chunk podado se omite, no tumba la ruta), corte temprano al juntar
   los eventos necesarios, y degradacion graciosa con `activityError` informativo.
3. Una API route nunca debe devolver 500 porque un tramo del historial este
   podado: devolver `ok: true` con datos parciales y nota.
4. Para historial completo: proveedor con archivo (Alchemy/Infura con key) via
   env `SEPOLIA_RPC`, o datos pre-indexados (8004scan API para reputacion).

---

## 7. Seguridad

1. **NUNCA commitear llaves privadas.** Historico: la llave del owner quedo
   expuesta en `skills/entropiav2/SKILL.md` y `8004/my-agent/DEPLOY-VERCEL.md`
   (scrubbed el 8 oct 2026). Si una llave real se commiteo alguna vez, tratarla
   como comprometida: rotar (mover activos y agentes a wallet nueva).
2. Archivos sensibles y sus protecciones en `.gitignore`:
   - `8004/my-agent/.env`, `.env*` (llaves del owner, PINATA_JWT, API keys LLM)
   - `8004/my-agent/.feedback-wallet.json` (llave de la wallet tester)
   - Verificar SIEMPRE con `git check-ignore -v <archivo>` despues de crear
     archivos con secretos.
3. Las env vars de produccion viven en Vercel (`npx vercel env ls production`),
   no en el repo.
4. Antes de `git add -A`, revisar `git status` para no arrastrar secretos ni
   binarios raros (este repo ha tenido `.exe` sueltos y archivos `nul`).

---

## 8. Checklists

### Deploy del agente (my-agent)
1. Editar codigo en `8004/my-agent/`.
2. `npm run build` (tsc) local, exit 0.
3. Commit + push a master.
4. `npx vercel --prod --yes` dentro de `8004/my-agent/` (el push NO lo despliega).
5. Verificar en vivo: GET /health (200), GET /mcp (200), agent-card (200),
   GET /v1/premium-composition (402 con accepts).
6. Si cambio metadata (imagen, endpoints, x402Support): `npm run register`
   y verificar el nuevo CID en `raw_metadata.offchain_uri` via API de 8004scan.

### Deploy del frontend (videodanza-nft)
1. Editar codigo en `frontend/`.
2. `cd frontend && npm run build`, exit 0 OBLIGATORIO antes de pushear.
3. Commit + push a master (el deploy es automatico por Git).
4. Verificar estado READY del deployment via MCP/CLI (projectId
   `prj_hrqE8ac95yRFfS2FhXopBryZYqPS`) y probar la pagina en vivo.

### Despues de CUALQUIER push a master
1. Revisar los DOS proyectos Vercel (frontend auto, agente manual).
2. Frontend: deploy nuevo debe llegar a READY. Si falla, `npx vercel inspect`
   para build logs.
3. Agente: si hubo cambios en `8004/my-agent/`, desplegar por CLI y probar
   endpoints.

---

## 9. Comandos frecuentes (PowerShell, Windows)

```powershell
# Agente
cd C:\Users\petra\videodanza-nft\8004\my-agent
npm run build
npx vercel --prod --yes
npm run register          # re-registro onchain (IPFS + setAgentURI)

# Feedback (usar workaround de gas de la seccion 4, NO sdk.giveFeedback directo)

# Frontend
cd C:\Users\petra\videodanza-nft\frontend
npm run build

# Logs de un deployment (Windows: el comando se cuelga, usar archivo + timeout)
npx vercel logs <deployment-url>

# Verificacion rapida de endpoints del agente
curl.exe -s https://my-agent-tau.vercel.app/health
curl.exe -s -X POST https://my-agent-tau.vercel.app/mcp -H "Content-Type: application/json" -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\",\"params\":{}}'

# Estado del agente en 8004scan (fuente de verdad)
curl.exe -s https://api.8004scan.io/api/v1/agents/11155111/2387
```

---

## 10. Historial del revival (8 oct 2026)

Commits clave en master:
```
7db46f6 feat/agente_revival_mcp_health_tia_style   (GET /mcp 200, /health, landing TIA-style, logo.svg)
2791074 chore/gitignore_feedback_wallet
7b50d2b feat/x402_premium_composition_usdc_base_sepolia
0e840c5 fix/x402_req_path_polyfill_vercel_serverless
6d1ebad fix/x402_req_header_originalurl_polyfill
c5ac83e fix/commit_lockfiles_vercel_builds_reproducibles  (FIN de los builds fallidos)
4a90e1e fix/premium_llm_timeout_settle_x402
e60c6c4 fix/premium_x402_deadlock_next_callback           (FIN del 504 en llamadas pagadas)
8995d77 docs/prueba_onchain_x402_primera_llamada_pagada
```

Txs onchain del dia:
```
0x39a7da...  re-registro con imagen nueva (Sepolia)
0x1442df...  re-registro con x402Support=true (Sepolia)
0x4424bd...  fondeo wallet tester 0.02 ETH (Sepolia)
0x816cbc...  feedback #1 value 5 tags studio/videodanza (Sepolia, Reputation Registry)
0xa7a15a...  feedback #2 value 5 tags a2a/mcp-health (Sepolia)
0xb63c10...  primera llamada premium pagada 0.10 USDC (Base Sepolia)
```

Estado final verificado: landing 200, health 200, MCP GET/POST 200, agent-card
200 con imagen nueva, premium 402->200 con pago, frontend READY, rank de 8004scan
pendiente del rescaneo diario de health (sale de integrity:broken cuando su
checker vea GET /mcp en 200).

---

## 11. Referencias

- x402 (Coinbase): https://github.com/coinbase/x402 y https://www.x402.org/
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- 8004scan API: https://8004scan.io/developers (base https://api.8004scan.io/api/v1)
- Agent0 SDK: https://sdk.ag0.xyz/
- TIA (modelo de API pagada para agentes): https://stellar.holatia.app/
- Faucet USDC testnet (login humano): https://faucet.circle.com/
- Skill hermana: `skills/entropiav2/SKILL.md` (arquitectura y contenido del agente)
