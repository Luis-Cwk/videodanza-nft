# Plan: Secuencia de video (entropiav2)

Estado: **preview desplegado en producción (2026-11-19). El render lo hace Petra
en su cuenta.** Pedidos por Discord; cobro manual.

## Flujo real

1. El pedido llega al canal privado de Discord (o lo recibe el agente).
2. Se piden las especificaciones con la ficha de abajo.
3. El agente arma la secuencia: tres prompts con CANON identico, material de
   empalme, negativo y ajustes.
4. Petra revisa y renderiza en su cuenta, dentro de su cupo diario.
5. Se entrega el archivo y la direccion creativa.

No hay llamada a la API de video. No hay facturacion de Google. No hay cola
asincrona. Todo lo que en la version anterior era bloqueo desaparece con este
flujo.

## Producto

- **Secuencia**: tres clips de 8 s que empalman por un objeto fisico que llena el
  cuadro, no por un corte. Mismo canon en los tres.
- 16:9 o 9:16, un estilo, un encargo, una revision.
- Precio: **1.50 USDC** (o su equivalente acordado).
- Cupo: un encargo por dia. Son tres clips: el tope real de generacion.
- Se entrega: los prompts, el frame exacto de empalme, el negativo, y el render
  como cortesia dentro del cupo.
- No se entrega exclusividad: una salida de modelo no es obra protegible.

## Que se vende (esto importa)

Se vende **direccion**: el canon, el empalme, la curaduria. El render es la
cortesia de Petra dentro de su propio cupo, no el objeto del contrato. Esa
distincion no es retorica: describe quien hace que, y evita presentar el servicio
como reventa de una cuota de consumidor.

Consecuencia practica: no anunciarlo como "render on demand" ni prometer
volumen. Un encargo al dia, y si el cupo no alcanza, se dice antes de cobrar.

## Filtro (antes de cobrar)

Se rechaza en la ficha, no despues del render:

- contenido sexual explicito
- personas menores de edad
- violencia grafica
- marcas, logotipos, personajes o franquicias con derechos
- personas reales identificables sin consentimiento por escrito

El filtro es por texto y es un primer paso. La confirmacion del cliente sobre
derechos de imagen va aparte y por escrito.

## Piezas

| Pieza | Ruta | Que hace |
|---|---|---|
| Constructor | `src/video-prompts.ts` | Tres prompts con canon identico, material de empalme, negativo, ajustes. Deterministico. |
| Filtro | `src/video-prompts.ts` | Rechazo por texto antes del cobro. |
| Preview gratis | `api/video-preview.ts` | `GET/POST /v1/video/preview`. Escaparate y validador. No genera video. |
| Tool MCP | `src/tools.ts` | `video_preview`, para agentes. |
| Ficha A2A | `.well-known/agent-card.json` | Skill `video_sequence`. |
| Pedidos | `scripts/video-order.mts` | Toma el pedido, valida, arma y deja el entregable listo para pegar en Discord. |
| Registro | `documentos/entropia/video-pedidos/` | Un JSON por pedido, el `.txt` del entregable y `_pedidos.ndjson`. |

## Comando

Con la ficha pegada del canal:

```powershell
cd C:\Users\petra\videodanza-nft\8004\my-agent
npx tsx scripts/video-order.mts ficha.txt --cliente "@quien-es"
```

O con un pedido en JSON, o con el brief en linea:

```powershell
npx tsx scripts/video-order.mts pedido.json
npx tsx scripts/video-order.mts --brief "un cuerpo que aprende a caer" --aspect 9:16 --cliente "@alguien"
```

El JSON acepta: `cliente`, `brief`, `aspect`, `uso`, `evitar`,
`personas_reales`, `marcas_o_personajes`, `estado_pago`. Si `personas_reales` o
`marcas_o_personajes` vienen en `true`, el pedido se rechaza y queda registrado.

La ficha numerada (los siete puntos) se pega en un `.txt` y se corre igual. El
script imprime **LECTURA DEL PEDIDO** y **PREGUNTAS ANTES DE RENDERIZAR** antes
del entregable: eso es la guia para preguntar antes de gastar cupo.

Texto de la ficha para fijar en el canal: `FICHA-VIDEO-DISCORD.md`.

## Pendiente

1. Fijar en el canal privado el bloque de `FICHA-VIDEO-DISCORD.md`.
2. Decidir si el bot contesta solo o si Petra pega la respuesta del script.
   Por ahora: Petra elige la salida.
3. Revisar el precio con el primer pedido real: 1.50 es barato para una revision
   incluida.
