# Ficha de pedido para Discord

Dos piezas: el mensaje ancla del canal privado y el canal de foro con las
instrucciones. Los textos de abajo son los finales, listos para pegar.

## 1. Mensaje ancla (canal privado)

Va fijado. El cliente lo copia, lo llena y lo manda.

```
PEDIDO DE SECUENCIA

Responde los siete puntos y con eso se arma el pedido.

1. Qué debe pasar, en una o dos frases.
2. Quién o qué aparece.
3. 16:9 o 9:16.
4. Dónde se va a usar.
5. Hay personas reales en el pedido: sí o no.
6. Hay marcas, logotipos o personajes: sí o no.
7. Qué NO quieres ver.

Tres clips de 8 s que empalman por un objeto que llena el cuadro.
Un estilo, una revisión. 1.50 USDC. Un encargo por día.

No se acepta: personas reales sin consentimiento por escrito, marcas o personajes con derechos, contenido sexual, violencia gráfica ni menores.
```

## 2. Canal de foro

- Nombre: `pedidos`
- Tipo: foro
- Etiquetas: `16:9`, `9:16`, `dudas`, `entregado`, `pagado`
- Tema del canal (son las guidelines que se ven al abrir un tema):

```
Pedidos de secuencia. Abre un tema, elige la etiqueta 16:9 o 9:16 y responde los siete puntos.
1. Qué debe pasar, en una o dos frases.
2. Quién o qué aparece.
3. 16:9 o 9:16.
4. Dónde se va a usar.
5. Hay personas reales: sí o no.
6. Hay marcas, logotipos o personajes: sí o no.
7. Qué NO quieres ver.
Tres clips de 8 s que empalman, un estilo, una revisión. 1.50 USDC. Un encargo por día.
Sin personas reales sin consentimiento escrito, sin marcas ni personajes con derechos, sin contenido sexual, violencia ni menores.
```

Ajuste recomendado: exigir etiqueta al crear el tema, para que no entren pedidos
sin formato.

## Estado (2026-11-19)

- Preview desplegado en producción: `https://entropia.petrasynthetic.com/v1/video/preview`,
  JSON, tres clips por respuesta. MCP con 13 tools y agent card con 12 skills.
- Ancla publicada y fijada en `#compas`: mensaje `1572068037828411447`.
  https://discord.com/channels/939344673993015347/1568095309656104960/1572068037828411447
- Foro `pedidos` creado: canal `1572068476191908051`, tema con las guidelines,
  etiquetas `16:9`, `9:16`, `dudas`, `pagado`, `entregado`, y etiqueta
  obligatoria al publicar.
- Permisos de `@everyone`: `#compas` abierto (ver y escribir) y `pedidos`
  abierto (ver, crear publicaciones y responder). Verificado por API:
  `allow=274877910016`, `deny=0`.
- El mensaje sale a nombre de `Curiosity...` (app `860312358542245898`), que es
  la del token en `discord-bots/cyborg-petra-app/.env`. No sale como
  `BetaPetra Bot`.
- El foro hereda los permisos del servidor: puede publicar cualquiera que esté
  dentro, no solo clientes.

Verificado por API: tipo 15 (foro), tema con el texto, cinco etiquetas, flag 16
(etiqueta obligatoria).

Lo que el bot puede y no puede:

- Enviar mensajes: sí.
- Fijar mensajes (Gestionar mensajes): sí.
- Crear canales (Gestionar canales): no.
- Ver `#private`: no.

El foro se creó desde la sesión de Petra en Brave. Para cambios de estructura
(tema, etiquetas, permisos) hay que hacerlo desde la interfaz o darle Gestionar
canales al bot.

## Cómo se procesa un pedido

1. Copiar el mensaje del cliente a un `.txt`.
2. Correr:

```powershell
cd C:\Users\petra\videodanza-nft\8004\my-agent
npx tsx scripts/video-order.mts ficha.txt --cliente "@quien-es"
```

3. El script imprime:
   - **LECTURA DEL PEDIDO**: qué entendió, formato, material de empalme, uso y qué evitar.
   - **PREGUNTAS ANTES DE RENDERIZAR**: los huecos del brief. Es la guía para
     preguntar antes de gastar cupo, no después.
   - **RESPUESTA PARA EL CANAL**: el mensaje final, con los tres prompts, el
     negativo, cómo empalmar y las condiciones. Se pega tal cual.
4. Revisar los prompts. Si algo no cuadra, se corrige el brief y se vuelve a
   correr: no se edita el prompt a mano.
5. Renderizar en la cuenta propia. Los clips se encadenan con el último frame de
   cada uno como primer frame del siguiente.
6. Cambiar `estado_pago` en el JSON del registro cuando entre el pago.

## Si el cliente escribe suelto y no llena la ficha

El script lo acepta: toma todo el texto como brief y avisa que no encontró la
ficha numerada. Esa es la señal para pedirle los siete puntos antes de
renderizar.

## Registro

`C:\Users\petra\agentex\documentos\entropia\video-pedidos\`

- `AAAA-MM-DD-slug.json`: pedido, secuencia, dudas y respuesta.
- `AAAA-MM-DD-slug.txt`: el entregable para pegar.
- `AAAA-MM-DD-slug-rechazado.json`: pedido rechazado y por qué.
- `_pedidos.ndjson`: una línea por pedido, para contar y cobrar.
