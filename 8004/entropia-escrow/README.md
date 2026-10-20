# entropia-escrow

Escrow con adjudicación por consenso para las composiciones que vende **entropiav2** (agente ERC-8004 `11155111:2387`).

El comprador deposita GEN, el agente entrega una URL, y si hay desacuerdo el contrato corre un juicio con **consenso real**: los validadores de GenLayer descargan el entregable, un LLM lo compara contra el brief con rúbrica de evidencia y el veredicto libera o reembolsa el depósito.

Es el experimento de la "capa de adjudicación" aplicada al flujo de venta del agente: x402 cobra, ERC-8004 da identidad, y este contrato resuelve el desacuerdo.

## Estado verificado

### Studionet (gasless, chain 61999)

- Contrato de la última corrida: `0x3F6ff110fa8DA1D3517521cE697BD75377C7D721`
- Deploy con 5 validadores AGREE: `0xb4caf9057201595e55b87d54b6955f8ff8cc9e649f0c8d2f951df01ace06a04e`
- Demo end-to-end: 2 de 2 veredictos correctos.
  - Entrega que sí cumple el brief (poema de videodanza) -> `release` (depósito al vendedor).
  - Entrega ajena (example.com) -> `refund` (depósito al comprador).
- Veredictos con evidencia: el juicio cita fragmentos del entregable y marca cada requisito del brief como MET o NOT MET.

### Testnet Bradbury (chain 4221, modelos y web reales)

- Contrato: `0xF0870e9775DEEc42389c7C30B865eC6c236e5F32`
- `ord-0`: disputa sobre una entrega que sí cumplía el brief -> **RELEASED** con veredicto `release`.
  - La razón del juicio cita 4 fragmentos del poema y marca cada requisito como MET.
- `ord-1`: disputa sobre una entrega ajena (example.com) -> **REFUNDED** con veredicto `refund`.
  - La razón cita el texto de example.com y marca los tres requisitos como NOT MET.
- El dinero se movió de verdad: buyer 10 -> 9.4967 GEN y seller 10 -> 10.4973 GEN.
  - `ord-0` liberó 0.5 GEN al seller.
  - El refund de `ord-1` queda como mensaje externo y se ejecuta al finalizar la tx (ventana de apelación).

## Estructura

```text
contracts/composition_escrow.py   Contrato principal (Intelligent Contract, Python)
tests/direct/                     Pruebas directas (8, corren en ~0.5s sin red)
scripts/demo.mjs                  Flujo end-to-end para studionet (genlayer-js 1.1.8)
scripts/create-order.mjs          Crea la orden pagable en Bradbury (buyer)
scripts/demo-bradbury.ps1         Flujo híbrido Bradbury: JS para la orden, CLI para el resto
scripts/balances.mjs              Consulta balances GEN por RPC
tools/web_probe.py                Sonda de depuración: descarga una URL por consenso y guarda el fragmento
```

## API del contrato

| Método | Quién | Qué hace |
|---|---|---|
| `create_order(brief, ttl_seconds)` payable | comprador | Deposita GEN y crea el pedido. Rechaza depósito en cero y que el vendedor se compre a sí mismo |
| `submit_delivery(order_id, delivery_url, delivery_note)` | vendedor | Registra la entrega (URL http/https) |
| `accept(order_id)` | comprador | Libera el depósito al vendedor sin juicio |
| `claim_timeout(order_id)` | comprador | Pasado el deadline sin entrega, reembolsa |
| `dispute(order_id, reason)` | comprador | Abre la disputa |
| `resolve_dispute(order_id)` | cualquiera | Corre el juicio con consenso (web + LLM) y paga: `release` al vendedor, `refund` al comprador |
| `get_order`, `get_orders`, `get_order_count`, `get_seller` | vista | Lectura de estado |

## Comandos

```powershell
# Linter (obligatorio antes de tocar el contrato)
.venv\Scripts\genvm-lint.exe check contracts\composition_escrow.py

# Pruebas directas (rápidas, sin red)
.venv\Scripts\python.exe -m pytest tests/direct -v

# Demo end-to-end en studionet (despliega y corre los dos casos)
node scripts/demo.mjs

# Reusar un contrato ya desplegado
$env:CONTRACT_ADDRESS = "0x..."; node scripts/demo.mjs

# Balances GEN de las cuentas de la demo (default: Bradbury)
node scripts/balances.mjs

# Bradbury (flujo híbrido JS + CLI, ver sección de cuotas)
$env:GL_PASSWORD = "..."; $env:CONTRACT_ADDRESS = "0xF0870e9775DEEc42389c7C30B865eC6c236e5F32"
.\scripts\demo-bradbury.ps1

# Sonda de fetch (depurar qué ve la red en una URL)
"genlayer-local-2026" | genlayer deploy --contract tools/web_probe.py
"genlayer-local-2026" | genlayer write <addr> probe --args "https://..."
genlayer call <addr> get_probe
```

Las llaves de la demo viven en `.secrets/demo-keys.json` (gitignored). En Bradbury cada cuenta necesita GEN del faucet: https://testnet-faucet.genlayer.foundation/

## Bradbury: cuotas y SDK (importante)

Bradbury cobra cuota de protocolo y exige que la transacción incluya un depósito. El estado real de las herramientas:

| Herramienta | Resultado en Bradbury |
|---|---|
| CLI `genlayer write` | Funciona: calcula y adjunta la cuota. Es la vía confiable para métodos no pagables. |
| `genlayer-js` 1.1.8 | `create_order` pagable funciona (con el depósito como valor). En métodos no pagables revierte el EVM porque no adjunta cuota. |
| `genlayer-js` 2.0.0-rc.1 | Trae `estimateTransactionFeesForWrite` y `fees`, pero las lecturas de política de cuotas revierten en Bradbury (`messageFeeParamsBudgetFloor`, `quoteGasPrice`). |

Por eso `scripts/demo-bradbury.ps1` usa JS solo para `create_order` y el CLI para `submit_delivery`, `dispute` y `resolve_dispute`. El CLI no puede enviar `value`, así que todavía no puede crear escrows con depósito por sí solo. Para valor real, usa el CLI o espera soporte de cuotas estable en el SDK.

Nota: el pago de un veredicto (`emit_transfer`) es un mensaje externo y se ejecuta cuando la transacción **finaliza**, no cuando se acepta. `genlayer finalize <tx>` puede revertir si la ventana de apelación sigue abierta; en ese caso hay que esperar.

## Diseño del juicio

- **Líder**: descarga el entregable con `gl.nondet.web.request` (clasifica errores 4xx como `[EXTERNAL]` y 5xx como `[TRANSIENT]`), recorta la página a 20k caracteres y pide al LLM un JSON `{decision, score, reason}` con rúbrica: primero citar evidencia, luego marcar requisitos, y solo entonces decidir.
- **Validador**: repite la misma tarea y exige coincidencia exacta en `decision` y diferencia de `score` <= 30. Si el líder falló, compara errores por prefijo (`[EXPECTED]`, `[EXTERNAL]`, `[TRANSIENT]`) y fuerza rotación ante errores del LLM.
- La decisión explícita evita el sesgo de "el que se queja gana": una entrega que cumple el brief se libera aunque el comprador dispute.

## Atajos conocidos (deliberados en este MVP)

- `shortcut: sin ventana de disputa ni apelación propia; el comprador puede disputar cualquier entrega y cualquiera puede disparar el juicio. Agregar plazos cuando haya valor real en juego.`
- `shortcut: un solo vendedor y sin reembolsos parciales; el escrow es todo o nada.`
- `shortcut: depósito y pago en GEN nativo, no en USDC como el flujo x402.`
- `shortcut: no hay re-juicio on-chain; el `appeal` del protocolo existe pero no está expuesto en el contrato.`
- `shortcut: la sonda web_probe usa strict_eq y sirve solo para textos estáticos.`

## Gotchas de Windows (documentados aquí porque se van a repetir)

- El SDK directo descarga `genvm-universal.tar.xz` desde GitHub y esa URL da 404 para `v0.3.0-rc7`. Se copia el tarball que ya cachea `genvm-linter`: `~/.cache/genvm-linter/genvm-universal-v0.3.0-rc7.tar.xz` -> `~/.cache/gltest-direct/`.
- `genlayer-test` (0.29.2) tiene un bug en Windows en `gltest/direct/loader.py`: borra el archivo temporal que sigue abierto como stdin. Parche local: `try/except OSError` alrededor de `os.unlink`.
- Los fixtures `direct_alice/direct_bob` devuelven `bytes` cuando el SDK no es importable en la colección; hay que convertir con `0x + hex` antes de pasarlos como `Address`.
- studionet limita 60 req/min; `scripts/demo.mjs` ya espacia escrituras y reintenta errores transitorios del RPC.

## Siguiente paso

- Esperar la finalización de `resolve_dispute` de `ord-1` para que se ejecute el reembolso de 0.5 GEN.
- Reintentar `create_order` con valor cuando el SDK estable adjunte cuotas (hoy solo el CLI maneja cuotas bien, y no envía valor).
- Conectar el flujo al agente: orden desde el endpoint premium para montos mayores, y `dispute` visible para el comprador.
- GenLayer sigue sin mainnet (roadmap: release candidate "Clarke", objetivo Q4 2026). Todo esto es testnet.
