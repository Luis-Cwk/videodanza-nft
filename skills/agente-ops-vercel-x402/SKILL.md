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

Tools del MCP (14 oct 2026): chat, generate_composition, generate_contract,
describe_nft, get_agent_info, subscribe_newsletter. La ultima suscribe un correo
a la newsletter de Petra: reusa el form hospedado de Brevo del sitio
(sibforms.com, doble opt-in) para funcionar sin API key ni backend propio. Un
POST server-to-server al form (campos EMAIL, email_address_check vacio,
locale=es) responde 200 y redirige a
`/v2/confirmation/success/subscription/double`.

### Identidad onchain

| Dato | Valor |
|---|---|
| Agent ID | `11155111:2387` (Sepolia) |
| Owner / agentWallet (desde rotacion 9 oct 2026) | `0xD70ECAff906A739167EFD20275D0a1d518AC40cF` (llave en `8004/my-agent/.owner-wallet.json`, gitignored) |
| Wallet vieja RETIRADA | `0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa` (llave expuesta en repo publico mar-oct 2026; NO usarla; le quedan 0.1 USDC en Base Sepolia sin gas para moverlos) |
| Identity Registry Sepolia | `0x8004A818BFB912233c491871b3d84c89A494BD9e` |
| Reputation Registry Sepolia | `0x8004B663056A597Dffe9eCcC1965A193B7388713` |
| Validation Registry (testnet y mainnet, misma) | `0x8004Cb1BFb31DAf7788923b405b754f57acEB4272` |
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

### Niveles de ranking: como subir (9 oct 2026, verificado contra algoritmo v5.2)

Pesos: prueba/evidence 85%, soporte 15%. Dimensiones: engagement 30%,
service 25%, publisher 20%, compliance 15%, momentum 10%.

Palancas ordenadas por impacto:
1. **Salud de endpoints (desbloqueo).** Un servicio declarado caido pone
   `integrity_tier: broken` y banda de score 5 a 15: nada mas mueve la aguja
   hasta que el health checker lo ve sano. GET /mcp debe responder 200.
   El checker corre en ciclo diario (~19:35 UTC observado) y cachea.
2. **Engagement (30%, el peso mayor).** Stars, chats y views desde la UI de
   testnet.8004scan.io. Nuestro baseline: 0 chats, 0 stars, ~59 views =
   engagement ~7. Los top tienen cientos de chats. Accion: chatear con el
   agente desde la UI logueado, darle star, compartir el link.
3. **Volumen de feedbacks (proof).** Con 2 feedbacks value 5 el proof_score
   seguia en 0 y evidence_tier en early: hacen falta mas clientes distintos
   con tags variados. El 9 oct se sumaron feedbacks #3 y #4 (tags
   composition/deterministic y contracts/solidity) desde testers 2 y 3
   (wallets en `.feedback-wallet-2/3.json`, gitignored). Cada tester necesita
   ~0.008 ETH Sepolia para gas (el workaround de gas de la seccion 4 aplica:
   estimateGas*1.3, el SDK revierte con su limite de 300k).
4. **Metadata completa (compliance).** Huecos detectados vs el estandar oficial
   (best-practices.8004scan.io): sin servicio OASF, sin web/email, sin
   updatedAt, sin mcpTools/a2aSkills. Fix del 9 oct (commit accc020): OASF con
   6 skills + 3 dominios validados contra la taxonomia embebida del SDK
   (validateOASF=true), descripcion con pricing x402, mcpTools/a2aSkills
   auto-crawleados por setMCP/setA2A, updatedAt automatico del SDK. Esto puebla
   tags/categorias en 8004scan y el tier de discoverability. Limitacion del
   SDK v1.4.2: no hay tipos web/email/EndpointType generico, se documenta como
   pendiente.
5. **Perfil de publisher (20%).** Hecho el 14 oct 2026 via API (script
   `scripts/8004scan-profile.mjs`): login owner -> POST /storage/upload (avatar)
   -> PUT /auth/me (username `petra`, bio, website, twitter `kinetic4i`). OJO:
   el score de esta dimension NO lo compone el perfil visible; se compone de
   wallet_score (historial onchain de la wallet, sube lento) + validation_bonus
   (validations recibidas) + cert_bonus. La certificacion de publisher existe
   (`POST /users/me/certifications/publisher/apply`, pide datos de organizacion
   y pasa por KYC; status al 14 oct: null, nunca aplicada). Decision del humano,
   no enviar solo.
6. **Dominio propio.** La verificacion de endpoint se salta en hosting de
   terceros (vercel.app). Un subdominio propio (ej. entropia.petrasynthetic.com:
   agregar dominio en dashboard Vercel + CNAME a cname.vercel-dns.com en el
   registrador, luego actualizar AGENT_BASE_URL, redeploy y re-register) la
   activa.
7. **Mainnet.** Cuando testnet este sano: registrar copia en Base/Ethereum para
   la liga principal (mas competencia, mas visibilidad).

### Perfil de Clawk (el otro ranking)

@petra verificado el 9 oct: banner generado (1500x500, gradiente + logo,
`agentex/clawk-banner.png`), bio con entropiav2/x402/SomaAgent (max 160
caracteres, el PATCH es por campo individual), location CDMX, website al
agente. Avatar ya existia. Subir banner/fotos da boost 1.2x en posts.

14 oct 2026: anuncio del newsletter para agentes (clawk 69a9bcc8...) invitando
a suscribirse via la tool MCP subscribe_newsletter, con @funwolf de gancho
(agentmail). Regla del skill de Clawk: responder TODAS las menciones antes de
postear. Los replies de claudecraft son promocion masiva (Hermescraft), no
requieren respuesta. Reportar cada build con POST /actions.

### Prueba onchain de referencia (primera llamada pagada, 8 oct 2026)

- Tx: `0xb63c10b60ef17ce33eae03e789434fcab14fd60496eb2f8f672996f49c19d75c`
  (Base Sepolia, bloque 47876441, 0.10 USDC, payer `0x9732...DD13`,
  payTo `0x6bce...faa` (wallet vieja, previa a la rotacion del 9 oct 2026;
  el payTo actual es `0xD70E...40cF`), recibo success:true, HTTP 200 en 6.4s).
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

### Hallazgo 14 oct 2026: el tag `starred` es el que puntua

De 6 feedbacks nuevos, solo los que llevan tag1 `starred` poblaron el campo de
score (average_score 98.33 con 3 starred). Los feedbacks sin ese tag suman al
conteo pero no al promedio. Los feedbacks rotos (URI invalida) se revocaron con
`revokeFeedback`. Resultado del dia: score total 5.03 -> 50.1, rank 2 de testnet.
Tambien se corrio `setAgentWallet` (tx 0x45b6eda1...) para apuntar el
agentWallet a 0xD70E...40cF. Gotcha: el health checker de 8004scan verifica la
wallet en MAINNET; un agentWallet con actividad solo en Sepolia deja
`health: unknown` (integrity `degraded`) aunque los endpoints esten sanos.

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
  La imagen debe ser URL directa, NO un link a x.com ni data: URIs
  gigantes. **OJO con SVG (2026-10-15):** el proxy de 8004scan NO sirve SVG
  (devuelve 404 `"No safe image is available"` y lo cachea). Usar PNG de
  512x512 (`public/avatar.png` del my-agent). Tras re-registrar, su proxy
  tarda unos minutos en refrescar y convierte la imagen a webp.
- **Etiquetas de confianza de 8004scan** (segun el skill oficial `8004`):
  No Data (0 feedbacks), Emerging (1-4), Established (>=5 y avg>=50),
  Trusted (>=10 y avg>=70), Highly Trusted (>=20 y avg>=80), Caution (avg<0),
  Untrusted (>=5 y avg<-50). entropiav2 con 7 feedbacks y avg 93.75 esta en
  **Established**: con 10 feedbacks pasa a **Trusted**.
- engagement: stars, views, chats desde la UI de testnet.8004scan.io.
- Verificacion de dominio: con hosting de terceros (vercel.app) la verificacion
  se marca `skipped` (Third-party hosting domain). Un dominio propio lo resuelve.
- **Caches:** el health check corre en ciclo diario (~19:35 UTC observado);
  los mensajes dicen "(cached)" hasta el siguiente chequeo. El rescoring de
  feedback es mas rapido (minutos). Testnet rankea aparte de mainnet:
  testnet.8004scan.io/leaderboard (Sepolia, Base Sepolia, etc.).
- **Health check manual (owner):** `POST
  https://api.8004scan.io/api/v1/agents/11155111/2387/health-check` con login
  owner (nonce -> personal_sign -> token). Limite 5/dia, cooldown 10 min.
  Script: `scripts/request-health-check.mjs`. El ciclo automatico de cada agente
  corre aparte; el manual solo adelanta el chequeo propio.

API publica util (sin key, rate limited):
```
GET https://api.8004scan.io/api/v1/agents/11155111/2387
```
Devuelve rank, scores, breakdown completo, health por servicio y metadata.
Es LA fuente de verdad para verificar mejoras, mas confiable que la UI.

- **Con API key (desde 2026-10-14):** la key vive en `8004/my-agent/.env` como
  `SCAN8004_API_KEY` (archivo gitignored, nunca commitear). Se manda en el
  header `X-API-Key`. Limites: 600 req/min y 100k/dia (sin key: 30/min y
  1000/dia). Funciona en ambas bases: `api.8004scan.io/api/v1` y
  `testnet.8004scan.io/api/v1`. Si se filtra, se regenera desde el dashboard
  de 8004scan (Builder Hub).
- **API publica alternativa:** `https://www.8004scan.io/api/v1/public` (la que
  documenta el skill `8004scan` instalado en `~/.opencode/skills/8004scan`).
- **Webhooks (2026-10-15):** 8004scan tiene webhooks con eventos
  `feedback.received`, `star.received`, `star.removed`, `validation.requested`,
  `validation.completed`, `feedback.revoked`, firmados con HMAC-SHA256.
  **HECHO para entropiav2:** webhook id `0f3fe0b3-267c-4dbe-8395-64bdfbf70b6f`
  apuntando a `https://my-agent-tau.vercel.app/webhook` (funcion
  `api/webhook-8004.ts`): verifica firma HMAC (secret que devuelve 8004scan al
  registrar, guardado como `WEBHOOK_SECRET_8004` en Vercel y .env) y reenvia
  correo a dfrmnc22@gmail.com via Brevo. Registro/renovacion:
  `node scripts/register-webhook.mjs` (login owner nonce->firma->JWT).
  OJO: el endpoint de registro (`POST /api/v1/webhooks/register`, campo
  `webhook_url`) pide **JWT de sesion**, NO la API key; y el secret lo genera
  el servidor (el skill `8004scan-webhooks` documenta un flujo distinto con
  `url` y `secret` propios: el OpenAPI real manda). Las entregas se consultan
  con `GET /api/v1/webhooks/{id}/deliveries` (tambien con JWT). Su emisor de
  eventos corre con el mismo retraso que su indexador (minutos a horas).
  Skills de referencia: `~/.opencode/skills/8004scan-webhooks` (repo
  github.com/jiayaoqijia/8004, skills 8004 / 8004scan / 8004scan-webhooks).
- **Health check y wallet metrics (16 oct):** el health check evalua los
  servicios declarados + `owner_wallet`. Solo chequea tipos conocidos (a2a,
  mcp); `oasf`/`web`/`docs`/etc salen `skipped` ("Service type not
  health-checked") y eso NO baja el score (Otto tiene 7 skipped y 100). El
  `owner_wallet` SI pesa: si su pipeline de metricas no tiene datos de la
  wallet del owner -> "No wallet data available" -> overall `unknown` y
  health_score 76.67. Verificado 16 oct: NINGUNA wallet nueva tiene metricas
  (`GET /api/v1/wallets/{addr}/metrics` da 404, hasta para los agentes "bench"
  de otros; las wallets viejas si tienen) -> es su pipeline, no nuestro agente.
  Health check manual (login owner nonce->firma->JWT):
  `POST /api/v1/agents/{chain}/{id}/health-check` -> queued; 5/dia, cooldown 10
  min, el ranking refresca cada hora; script `scripts/request-health-check.mjs`.
  Su refresh de metadata exige URI HTTP(S): con `ipfs://` responde 400 ("Agent
  metadata URI must use HTTP or HTTPS").

---

## 6. RPCs publicos, pruned history y ethers vs viem (frontend)

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
4. **NO usar ethers v6 en rutas de servidor de Next.js.** En el bundle
   serverless de Vercel, ethers v6 revienta al decodificar resultados con
   `TypeError: Cannot assign to read only property '0' of object '[object Array]'`
   (sus Result extienden Array y llegan congelados; el entorno de Next los
   rompe). Falla SOLO en Vercel, local pasa, lo que vuelve loco el diagnostico.
   Usar **viem** (ya es dependencia directa del frontend): devuelve objetos
   planos, probado en produccion (commit `251c27f`, reputacion onchain viva).
   El diagnostico salio de `npx vercel logs <dominio>`: ahi aparece el warn real
   que el response JSON no muestra.
5. Para historial completo: proveedor con archivo (Alchemy/Infura con key) via
   env `SEPOLIA_RPC`, o datos pre-indexados (8004scan API para reputacion).

---

## 7. Seguridad

1. **NUNCA commitear llaves privadas.** Historico: la llave del owner viejo
   (`0x6bce...faa`) quedo expuesta en `8004/my-agent/DEPLOY-VERCEL.md` desde el
   commit `42c5aab` (30 mar 2026) en repo PUBLICO, y en el working copy de
   `skills/entropiav2/SKILL.md` (este nunca se commiteo con la llave). Scrub el
   8 oct 2026 (`b65991a`), pero la llave sigue en el historial de git.
   **Rotacion ejecutada el 9 oct 2026:** NFT 2387 transferido a la wallet nueva
   `0xD70ECAff906A739167EFD20275D0a1d518AC40cF` (tx `0x645060...e23f`), ETH
   barrido, metadata re-registrada (tx `0xedecfd...`), payTo x402 y AGENT_OWNER
   del frontend actualizados. La wallet vieja quedo retirada: NO volver a usarla
   ni referenciarla como owner.
2. Archivos sensibles y sus protecciones en `.gitignore`:
   - `8004/my-agent/.env`, `.env*` (llave del owner, PINATA_JWT, API keys LLM)
   - `8004/my-agent/.feedback-wallet.json` (llave de la wallet tester)
   - `8004/my-agent/.owner-wallet.json` (llave del owner NUEVO)
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

# Operacion 8004scan (scripts en 8004/my-agent/scripts/)
node scripts/8004scan-profile.mjs      # perfil de publisher (requiere AVATAR_PATH)
node scripts/request-health-check.mjs  # health check manual (1 de 5 diarios)
node scripts/check-cert-status.mjs     # estado de certificacion de publisher

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
0x645060...  ROTACION: NFT 2387 transferido a wallet nueva 0xD70E...40cF (Sepolia)
0x4870b1...  ROTACION: barrido de ETH viejo -> nuevo (Sepolia)
0xedecfd...  ROTACION: re-registro de metadata con owner nuevo (Sepolia)
0x19d984...  re-registro con OASF (6 skills + 3 dominios) y descripcion con pricing x402 (Sepolia, IPFS bafkreia4zb66...)
0xa65c4c7... fondeo tester 2 (0.008 ETH, Sepolia)
0x0aed51bd... fondeo tester 3 (0.008 ETH, Sepolia)
0x889dfe...  feedback #3 value 5 tags composition/deterministic (Sepolia)
0xa96e94...  feedback #4 value 5 tags contracts/solidity (Sepolia)
```

Estado final verificado: landing 200, health 200, MCP GET/POST 200, agent-card
200 con imagen nueva, premium 402->200 con pago, frontend READY, rank de 8004scan
pendiente del rescaneo diario de health (sale de integrity:broken cuando su
checker vea GET /mcp en 200).

---

## 11. Identidad Adapterscan (adapter ERC-8004, 15 oct 2026)

Adapterscan (docs.adapterscan.com, explorer testnet.adapterscan.com) es el scanner
del "adapter" de ERC-8004: contrato open source (MIT, unruggable-labs/adapter) que
se monta ENCIMA del registry y liga la identidad a un token o cuenta externa. La
identidad se llama UBID = `hashBinding(standard, boundAddress, tokenId)`, derivado,
no emitido. El registro "contrafactual" vive solo en el event log (1 tx, sin mint
ni storage); el `register()` completo mintea un ERC-8004 con las mismas
coordenadas y la historia se une sola.

Direcciones (Sepolia):
- Adapter proxy: `0x7621630cB63a73a194f45A3E6801B8C6A7eC2f92`
- Registry ERC-8004: `0x8004A818BFB912233c491871b3d84c89A494BD9e`
- delegate.xyz v2: `0x00000000000000447e69651d841bD8D104Bed493`

Standards en el contrato DESPLEGADO (ojo: la rama main del repo es mas nueva y no
coincide): 0 ERC721, 1 ERC1155, 2 ERC6909, 3 ERC1155F, 4 ERC6909F, 5 ACCOUNT,
6 CONTRACT_OWNABLE, 7 CONTRACT_ADMIN. ACCOUNT = ligar a una cuenta (tokenId 0).

**Lo que hicimos (verificado onchain):** identidad de entropiav2 anclada a la owner
`0xD70E...40cF` (standard 5 ACCOUNT, tokenId 0), URI = ipfs del registro, metadata
name "entropiav2", wallet operativa nueva `0xFc4f1119794DeAD15502AfAdb8c0069092e54e5f`
(llave en `.agent-wallet.json`, gitignored) linkeada con las dos firmas, mas rating
de las 3 testers y transaction record del pago x402 real. UBID:
`0x0806e9749b2940c22f04a666f578755e479e106e9dd5e6d785b0f82b9353be80`.
Script reproducible: `scripts/adapterscan-run.cjs`.

Txs: claim `0xa9d1f0a8...` (bloque 11925198), metadata `0x79510b5b...`, wallet
`0xbb528c4d...`, confirmacion ops `0xbf78a7e6...`, ratings `0xf0726c49` /
`0x0504b067` / `0xc2fe502f`, record `0x12e39fae...`

**Registro completo (misma sesion):** `register(5, owner, 0, uri, [name])` ejecutado
con exito -> agente ERC-8004 NUEVO **#11150** (owner en el registry = adapter
`0x7621630c...` por diseno; `bindingOf(11150)` = (5, `0xD70E...40cF`, 0);
`tokenURI` = la IPFS; `getMetadata(11150,'name')` = entropiav2; agentWallet unset
`0x0`). Tx `0x1978ad92...` (bloque 11925346, 987,303 gas, ~0.001 ETH con base fee
de 1 gwei). OJO: esto NO convierte al 2387 (sigue aparte); la identidad de cuenta
ahora es agente 8004 real. Script: `scripts/adapterscan-register-full.cjs`.

**Expansion del #11150 (16 oct):** (a) metadata rica en el perfil con eventos
baratos (~36k gas c/u): `description`, `x402`, `mcp`, `a2a`, `skills` (txs
0x26fd9166, 0xb26cad9e, 0xe9917c09, 0x8878174b, 0x1aaaade2). (b) Doble link de
wallet: agentWallet OFICIAL del #11150 en el registry = la ops `0xFc4f...` (firma
EIP-712 de la ops con owner = ADAPTER, el adapter reenvia; typehash
`AgentWalletSet(uint256 agentId,address newWallet,address owner,uint256 deadline)`,
dominio `ERC8004IdentityRegistry` v1, deadline <= now+5min; tx 0xad11668a; 8004scan
ya muestra la wallet). (c) 3 feedbacks al #11150 desde las testers (txs 0x389f875d,
0x12375321, 0x44dc064c). GOTCHA: giveFeedback para #11150 estima ~840k gas (vs
397k del 2o feedback al 2387): estimar siempre, no fijar gas a ojo (el primer
intento revirtio con 160k). Scripts: `scripts/adapterscan-expand.cjs` y
`scripts/adapterscan-feedbacks-11150.cjs`.

**Lo que NO se puede:** el adapter RECHAZA el registry como token ligado (revert en
`_requireValidTokenContract`), asi que el agente 2387 no se puede "fusionar" con su
UBID de registry; y `bindExisting` (jalar agentes ya minteados) aun no esta
desplegado en ninguna cadena (README del repo). La identidad en Adapterscan es
NUEVA y paralela, anclada a cuenta.

OJO con los ABIs desactualizados: la implementacion VIVA de Sepolia (15 oct 2026,
leida del slot EIP-1967 del proxy) es `0xab4188fa94aba7a6cf4605032ccd1be461406719`
(AdapterImplementation, 42 funciones; incluye attest, setWalletUBID, hashBinding,
counterfactual*; NO incluye bindExisting ni setPrimaryAgent). La direccion
`0x31a68E5b...` que lista el README del repo esta vieja y el ABI de Blockscout ahi
esta incompleto. Para saber si ya soltaron `bindExisting`: leer el slot
`0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc` del proxy y
revisar el ABI de la implementacion que devuelva.

Funciones utiles: `counterfactualRegister` / `counterfactualSetMetadata` /
`counterfactualSetAgentWallet` / `setWalletUBID` (cada wallet declara "trabajo para
esta identidad") / `counterfactualSetAgentWalletAndUBID` (ambas mitades si el caller
es ambos) / `attest(variante, ubid, variant, data)`: variante 3 = rating (score de
1 byte + texto, una viva por wallet), variante 5 = transaction record (score + tx
hash + nota, el hash tambien va en el slot variant). Las atestaciones funcionan
antes del claim.

Gotchas (15 oct): Tenderly gateway rate-limitea `eth_sendRawTransaction` (usar
publicnode o drpc); publicnode limita `eth_getLogs` a 50k bloques; viem
`estimateGas` fallaba con ExecutionRevertedError sin datos aunque el RPC crudo
pasaba, asi que los scripts firman local con `account.signTransaction` y mandan
crudo; el event log del adapter indexa el registrationHash (el UBID), se filtra con
`topics: [null, UBID]`.

---

## 12. Referencias

- x402 (Coinbase): https://github.com/coinbase/x402 y https://www.x402.org/
- ERC-8004: https://eips.ethereum.org/EIPS/eip-8004
- 8004scan API: https://8004scan.io/developers (base https://api.8004scan.io/api/v1)
- Agent0 SDK: https://sdk.ag0.xyz/
- TIA (modelo de API pagada para agentes): https://stellar.holatia.app/
- Faucet USDC testnet (login humano): https://faucet.circle.com/
- Adapterscan (docs): https://docs.adapterscan.com y explorer https://testnet.adapterscan.com
- Adapter ERC-8004 (codigo): https://github.com/unruggable-labs/adapter
- Skill hermana: `skills/entropiav2/SKILL.md` (arquitectura y contenido del agente)
