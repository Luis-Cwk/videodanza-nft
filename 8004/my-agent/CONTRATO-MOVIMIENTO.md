# Contrato: movimiento a estructura tipada (v0)

Borrador del primer endpoint de la fase 2. Escrito antes del código, para decidir
si vale la pena construirlo.

## La apuesta

El dato de NetIntel es que los agentes pagan por convertir algo sucio en
estructura limpia, no por datos exóticos. Un agente que ya tiene movimiento (de
un video, de un rig, de una captura) no necesita que alguien se lo describa:
necesita que alguien se lo **estructure** en un esquema que pueda consumir sin
parsear a mano.

## Alcance de la v0

**Entra:** JSON con landmarks ya extraídos, en el formato de MediaPipe Pose
(33 puntos por frame, normalizados 0-1).

**Sale:** JSON estricto con fases, tempo, keyframes y una medida de calidad.

**No entra:** extraer pose desde un video. Eso sería otro endpoint, pesado, y no
existe todavía. Prometerlo en la v0 sería mentir en la respuesta 402.

## Contrato

```
POST /v1/movement/analyze
Content-Type: application/json
```

**Entrada**

```json
{
  "frames": [
    { "t": 0.0, "landmarks": [[0.51, 0.42, -0.01], "... 33 puntos"] },
    { "t": 0.033, "landmarks": ["..."] }
  ],
  "fps": 30,
  "options": { "min_phase_s": 0.4, "smooth": true }
}
```

- `frames[].t` en segundos, creciente. Si falta, se deriva de `fps`.
- `landmarks`: exactamente 33 puntos `[x, y, z]`. Se aceptan `null` para puntos
  no visibles; la cobertura los cuenta.
- `options` opcional, con valores por defecto.

**Salida 200**

```json
{
  "schema_version": "0.1.0",
  "duration_s": 4.2,
  "frame_count": 126,
  "fps_estimate": 30,
  "phases": [
    { "start_s": 0.0, "end_s": 1.4, "label": "ascendente", "energy": 0.31 },
    { "start_s": 1.4, "end_s": 2.9, "label": "sostenido", "energy": 0.72 }
  ],
  "beats": { "bpm": 96.4, "confidence": 0.68, "times_s": [0.62, 1.25, 1.87] },
  "keyframes": [
    { "t": 1.38, "reason": "extension_maxima" },
    { "t": 2.91, "reason": "cambio_de_fase" }
  ],
  "quality": { "coverage": 0.97, "jitter": 0.08, "confidence": 0.74 },
  "notes": ["dos frames con menos de 12 puntos visibles"],
  "deterministic": true
}
```

**Errores**

| Código | Cuándo |
|---|---|
| 400 | JSON inválido o esquema roto |
| 413 | más de 20,000 frames o más de 4 MB |
| 422 | menos de 10 frames, o menos de 8 puntos visibles de media |
| 429 | límite gratis alcanzado |

## Precio y límite

**Gratis**, 20 llamadas por día por IP, best-effort en memoria, igual que el
preview de due diligence.

El cobro se queda donde ya hay compradores: `/v1/agent-check`. Esta ruta es
anzuelo, no negocio. Si en cuatro semanas tiene uso repetido, se le pone precio;
si no, se apaga. Esa es la regla del plan.

## Determinismo

Misma entrada, misma salida. Sin reloj, sin azar, sin red. Es lo que permite a un
agente testear su integración, y es la razón por la que el endpoint puede correr
en una función serverless sin estado.

## Lo que prometemos y lo que no

- **Sí:** fases con inicio y fin, tempo estimado con confianza, keyframes
  justificados, calidad de la captura.
- **Sí:** `schema_version` semver. Campos nuevos se agregan opcionales.
- **No:** reconocer el tipo de movimiento (danza, deporte, gesto).
- **No:** extraer pose de video.
- **No:** estilos ni `mood`. Eso es `/v1/premium-composition`, otra ruta.

## Por qué esta y no otra

De las seis capacidades del plan, esta es la que:

1. se puede construir sin GPU ni procesar video (solo aritmética sobre números),
2. cabe en una función serverless de 30 segundos,
3. tiene un esquema de salida que otro agente puede tipar de una vez,
4. y reutiliza lo que ya existe en el rig de MediaPipe y en el análisis de
   videodanza.

## Criterio de aceptación

- Un fixture de 120 frames sintéticos produce fases y beats deterministas, y el
  mismo fixture dos veces da el mismo JSON byte a byte.
- Un fixture con 5 frames responde 422.
- Un fixture con la mitad de landmarks en `null` baja `coverage` y lo dice en
  `notes`.
- `/openapi.json` describe la ruta con su esquema de entrada y salida, y
  `@agentcash/discovery` la ve sin avisos.

## Siguiente paso si se aprueba

Escribir el analizador como función pura en `src/movement.ts`, con su fixture y su
test, antes de tocar la ruta HTTP.
