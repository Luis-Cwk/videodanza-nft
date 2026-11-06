# Contrato: movimiento a estructura tipada (v1)

Reescrito el 2026-11-05 después de medir. La v0 pedía landmarks ya extraídos y eso
no es mercado: es pedirle al cliente que resuelva la parte difícil. Esta versión
recibe **video**.

## Lo que se midió antes de prometer nada

MediaPipe Tasks (pose_landmarker_lite) sobre tres clips reales, en esta máquina,
CPU, sin GPU:

| Clip | Duración | Tiempo de proceso | Ratio | Frames con pose |
|---|---|---|---|---|
| `cruz_rosa.mp4` | 5.88 s | 5.57 s | **0.95x** | 57/141 (40%) |
| `rendered_video_2026-10-23` | 0.80 s | 1.59 s | **1.99x** | 8/24 (33%) |
| `tallfenn-demo.mp4` | 85.70 s | 149.20 s | **1.74x** | 847/2571 (33%) |

Dos conclusiones que mandan el diseño:

1. **La extracción es más lenta que tiempo real.** Un clip de 30 s cuesta cerca de
   un minuto de CPU. No cabe en una función serverless de 60 s, y Vercel no tiene
   Python ni MediaPipe de todos modos.
2. **La cobertura es de un tercio.** Dos de cada tres frames no tienen pose. Si no
   lo decimos, el cliente recibe una estructura construida sobre aire.

## La apuesta, corregida

La extracción de pose es mercancía: cualquiera la corre. Lo que no es mercancía es
la **capa de estructura**: fases con inicio y fin, tempo con confianza, keyframes
con razón, y una medida honesta de qué tan usable era el clip. Eso es lo que se
vende, y es lo que ya sabe hacer el trabajo de videodanza.

## Entrada

```
POST /v1/movement/analyze
Content-Type: application/json

{ "video_url": "https://.../clip.mp4", "max_seconds": 30 }
```

- `video_url` debe ser HTTPS público. Aceptamos mp4, mov y webm.
- `max_seconds` opcional, tope de procesamiento. Default 30, máximo 60.
- Límite de descarga: 100 MB.
- Si el cliente manda un archivo en vez de una URL, eso es otro endpoint
  (`multipart/form-data`), y no está en la v1.

## Salida 200

```json
{
  "schema_version": "1.0.0",
  "source": { "duration_s": 5.88, "fps": 24, "frames_read": 141, "frames_processed": 141 },
  "coverage": { "frames_with_pose": 57, "ratio": 0.40, "usable": false },
  "phases": [{ "start_s": 0.0, "end_s": 1.4, "label": "ascendente", "energy": 0.31 }],
  "beats": { "bpm": 96.4, "confidence": 0.68, "times_s": [0.62, 1.25, 1.87] },
  "keyframes": [{ "t": 1.38, "reason": "extension_maxima" }],
  "quality": { "jitter": 0.08, "confidence": 0.74 },
  "notes": ["cobertura baja: 40% de los frames sin pose; la estructura es tentativa"],
  "deterministic": false,
  "processed_by": "mediapipe-pose-lite"
}
```

**Cambio importante:** `deterministic` pasa a `false` en esta ruta. La extracción de
pose depende de la versión del modelo y del decodificador; prometer byte a byte
sería mentir. Sigue siendo reproducible con la misma versión, y eso va en
`processed_by` más un campo de versión de modelo cuando exista.

## Reglas de honestidad

- Si `coverage.ratio < 0.25`, la respuesta es **422** con el motivo. No devolvemos
  estructura inventada sobre un clip donde no se ve un cuerpo.
- Entre 0.25 y 0.5, se responde 200 con `usable: false` y una nota explícita.
- `notes` siempre dice por qué, en una frase que un agente pueda mostrar.

## Arquitectura

La extracción no corre en Vercel. Tres opciones, con lo medido:

| Opción | Cómo | Costo | Estado |
|---|---|---|---|
| API hospedada de pose | Nuestra función llama a Replicate o Roboflow, recibe landmarks, corre el análisis | Centavos por clip | **Recomendada para v1** |
| Worker propio | Ya existe el patrón en `entropy-acp-runtime`; procesa en cola | Cero por llamada, ~1.7x realtime | Si el volumen lo justifica |
| Contenedor | ffmpeg + MediaPipe siempre encendido | Costo fijo mensual | Cuando haya tráfico |

El endpoint sigue siendo síncrono si el clip es corto: descarga, pide la
extracción, analiza y responde dentro de los 60 s. Para clips largos, 202 con job
y un `GET /v1/movement/jobs/{id}`. Eso queda para la v1.1.

## Precio

- **Gratis:** clips de hasta 8 segundos, 3 por día por IP.
- **Pagado:** hasta 60 segundos. Precio a definir cuando se mida el costo real por
  llamada del proveedor; el techo es que cubra cómputo más margen.

El cobro grande sigue en `/v1/agent-check`. Esta ruta es la puerta de entrada.

## Lo que prometemos y lo que no

- **Sí:** fases, tempo con confianza, keyframes con razón, y una medida de calidad
  que se atreve a decir "este clip no sirve".
- **Sí:** un esquema estable y versionado que un agente puede tipar.
- **No:** reconocer el tipo de movimiento (danza, deporte, gesto).
- **No:** seguimiento de varias personas a la vez en la v1.
- **No:** devolver los landmarks crudos. Eso se paga aparte si alguien lo pide.

## Criterio de aceptación

1. Un clip de 5 s con una persona visible devuelve fases, beats y keyframes en
   menos de 60 s de punta a punta.
2. Un clip donde no se detecta cuerpo responde 422 con `coverage` en el cuerpo.
3. La misma llamada dos veces con el mismo clip y la misma versión da el mismo
   JSON, salvo `processed_by`.
4. `/openapi.json` describe la ruta con esquema de entrada y salida, y
   `@agentcash/discovery` la ve sin avisos.

## Dependencia abierta

Para la v1 hace falta una cuenta y un token de un proveedor de pose (Replicate o
Roboflow). Sin eso, la única alternativa es el worker propio y decirle al cliente
que la respuesta puede tardar. Esa decisión no la puedo tomar yo.
