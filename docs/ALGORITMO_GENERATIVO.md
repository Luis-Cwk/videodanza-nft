# ALGORITMO GENERATIVO - VIDEODANZA NFT

## 🎯 Objetivo

Crear combinaciones **únicas e irrepetibles** de videos + música basadas en un seed determinístico. Mismo seed = misma secuencia siempre (reproducible en blockchain).

---

## 🔑 Conceptos Clave

### 1. **Seed Determinístico**
```
seed = SHA256(
  wallet_address +
  timestamp_segundos +
  gender_code +
  perspective_code +
  music_tone_code
)

Resultado: "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b"
```

**Propiedad:** Mismo input = mismo hash = misma secuencia siempre

### 2. **Seeded Random Generator**
```javascript
// Usamos seed para inicializar generador pseudo-random
class SeededRandom {
  constructor(seed) {
    this.seed = parseInt(seed.slice(0, 16), 16);
  }
  
  next() {
    // Generador lineal congruencial (determinístico)
    this.seed = (this.seed * 1103515245 + 12345) % 2147483648;
    return this.seed / 2147483648;
  }
}

const rng = new SeededRandom(seed);
const index = Math.floor(rng.next() * array.length); // Determinístico
```

---

## 🎬 Estructura de Videos

### Pool de Videos Disponibles:

```
SOLOS (individual performers):
├─ Female perspectives (FEM_A, FEM_B, FEM_C, FEM_D, FEM_E) × 8 videos = 40
├─ Male perspectives (MALE_A, MALE_B, MALE_C) × 8 videos = 24
└─ Hybrid/Avatar perspectives (HYB_A, HYB_B, HYB_C) × 8 videos = 24
   Total SOLOS: 88 videos (~10-20 segundos cada)

DUOS (paired dancers):
├─ Female-Female (F-F) × 6 videos = 6
├─ Male-Male (M-M) × 4 videos = 4
└─ Mixed (F-M) × 10 videos = 10
   Total DUOS: 20 videos (~15-25 segundos)

GROUP (ensemble):
├─ 3+ performers × 5 videos = 5
   Total GROUP: 5 videos (~20-30 segundos)

TRANSITIONS (conectores entre clips):
├─ Fade transition × 2 variaciones
├─ Glitch transition × 2 variaciones
├─ Blackout transition × 1
└─ Morph transition × 1
   Total TRANSITIONS: 8 transiciones (~0.5-1 segundo)

TOTAL ASSETS: 121 clips de video
```

---

## 🎨 Lógica de Combinación

### Fase 1: Selección de Acto Principal

```javascript
function selectMainAct(seed, gender, perspective) {
  const rng = new SeededRandom(seed);
  
  // Mapeo de género a pools
  const genderPool = {
    'female': ['FEM_A', 'FEM_B', 'FEM_C', 'FEM_D', 'FEM_E'],
    'male': ['MALE_A', 'MALE_B', 'MALE_C'],
    'hybrid': ['HYB_A', 'HYB_B', 'HYB_C'],
  };
  
  const performer = genderPool[gender];
  const performerIndex = Math.floor(rng.next() * performer.length);
  const selectedPerformer = performer[performerIndex];
  
  // Selecciona 3-5 videos del mismo performer (continuidad coreográfica)
  const actLength = Math.floor(rng.next() * 3) + 3; // 3-5 videos
  const act = [];
  
  for (let i = 0; i < actLength; i++) {
    const videoNum = Math.floor(rng.next() * 8) + 1; // Video 1-8 del performer
    act.push(`${selectedPerformer}_v${videoNum}.mp4`);
  }
  
  return { performer: selectedPerformer, videos: act };
}

// Ejemplo output:
// {
//   performer: 'FEM_B',
//   videos: ['FEM_B_v3.mp4', 'FEM_B_v7.mp4', 'FEM_B_v2.mp4']
// }
```

### Fase 2: Selección de Dúo o Grupo (20% probabilidad)

```javascript
function selectSecondaryAct(seed, mainPerformer, rng) {
  const duoChance = rng.next(); // 0.0-1.0
  
  if (duoChance < 0.20) {
    // Seleccionar dúo
    const duos = ['FEM_FEM_01', 'MALE_MALE_01', 'MIXED_01', ...];
    const duoIndex = Math.floor(rng.next() * duos.length);
    const duoLength = Math.floor(rng.next() * 2) + 1; // 1-2 videos de dúo
    
    return {
      type: 'duo',
      videos: duos[duoIndex].split('_').slice(0, duoLength)
    };
  } else if (duoChance < 0.25) {
    // Seleccionar grupo (5% probabilidad)
    const groups = ['GROUP_ENSEMBLE_01', 'GROUP_ENSEMBLE_02', ...];
    return { type: 'group', videos: [groups[0]] };
  }
  
  return null; // Sin dúo ni grupo
}
```

### Fase 3: Inserción de Transiciones

```javascript
function addTransitions(videoSequence, seed, rng) {
  const transitions = ['fade', 'glitch', 'blackout', 'morph'];
  const result = [];
  
  for (let i = 0; i < videoSequence.length; i++) {
    result.push(videoSequence[i]); // Agregar video
    
    if (i < videoSequence.length - 1) {
      // Insertar transición antes del siguiente video
      const transitionIndex = Math.floor(rng.next() * transitions.length);
      const transition = transitions[transitionIndex];
      result.push(`transition_${transition}.mp4`);
    }
  }
  
  return result;
}

// Ejemplo output:
// [
//   'FEM_B_v3.mp4',
//   'transition_glitch.mp4',
//   'FEM_B_v7.mp4',
//   'transition_fade.mp4',
//   'FEM_B_v2.mp4',
//   'transition_blackout.mp4',
//   'DUOS_MIXED_01.mp4'
// ]
```

### Fase 4: Selección de Música

```javascript
function selectMusicTrack(seed, musicTone, rng) {
  const musicLibrary = {
    'melancholic': [
      { track: 'melancholic_01.mp3', bpm: 80, mood: 'introspective' },
      { track: 'melancholic_02.mp3', bpm: 75, mood: 'contemplative' },
      // ... más pistas
    ],
    'joyful': [
      { track: 'joyful_01.mp3', bpm: 120, mood: 'energetic' },
      // ...
    ],
    'abstract': [
      { track: 'abstract_01.mp3', bpm: 100, mood: 'experimental' },
      // ...
    ],
    'ambient': [
      { track: 'ambient_01.mp3', bpm: 60, mood: 'atmospheric' },
      // ...
    ]
  };
  
  const tracks = musicLibrary[musicTone];
  const trackIndex = Math.floor(rng.next() * tracks.length);
  return tracks[trackIndex];
}
```

### Fase 5: Selección de Filtros Visuales

```javascript
function selectVisualFilters(seed, rng) {
  const availableFilters = [
    { name: 'glitch', probability: 0.15 },
    { name: 'pixelated', probability: 0.10 },
    { name: 'thermal', probability: 0.12 },
    { name: 'inverted', probability: 0.08 },
    { name: 'mosaic', probability: 0.10 }
  ];
  
  const selectedFilters = [];
  
  availableFilters.forEach(filter => {
    if (rng.next() < filter.probability) {
      selectedFilters.push(filter.name);
    }
  });
  
  return selectedFilters.length > 0 ? selectedFilters : ['none'];
}

// Ejemplo output: ['glitch', 'thermal']
```

### Fase 6: Cálculo de Duración Total

```javascript
function calculateTotalDuration(videoSequence, musicTrack) {
  const videoDurations = {
    'FEM_A_v1.mp4': 12,
    'FEM_B_v3.mp4': 15,
    'transition_glitch.mp4': 1,
    // ... lookup de duraciones precargadas
  };
  
  let totalDuration = 0;
  videoSequence.forEach(video => {
    totalDuration += videoDurations[video] || 10; // default 10s
  });
  
  return totalDuration;
}
```

---

## 🎯 Función Principal: `generateComposition()`

```typescript
interface UserPreferences {
  gender: 'female' | 'male' | 'hybrid';
  perspective: 'dancer_pov' | 'spectator_pov' | 'multiple_pov';
  musicTone: 'melancholic' | 'joyful' | 'abstract' | 'ambient';
}

interface CompositionOutput {
  seed: string;
  gender: string;
  perspective: string;
  musicTone: string;
  videoSequence: string[]; // Array de IPFS CIDs
  musicTrack: string;      // IPFS CID
  visualFilters: string[];
  totalDuration: number;   // en segundos
  metadata: {
    createdAt: number;
    version: string;
  };
}

async function generateComposition(
  wallet: string,
  preferences: UserPreferences,
  timestamp: number
): Promise<CompositionOutput> {
  // 1. Generar seed determinístico
  const seed = generateSeed(wallet, timestamp, preferences);
  const rng = new SeededRandom(seed);
  
  // 2. Seleccionar acto principal (solos)
  const mainAct = selectMainAct(seed, preferences.gender, preferences.perspective);
  
  // 3. Seleccionar dúo/grupo (20% chance)
  const secondaryAct = selectSecondaryAct(seed, mainAct.performer, rng);
  const videoSequence = [...mainAct.videos];
  if (secondaryAct) videoSequence.push(...secondaryAct.videos);
  
  // 4. Agregar transiciones
  const sequenceWithTransitions = addTransitions(videoSequence, seed, rng);
  
  // 5. Seleccionar música
  const musicTrack = selectMusicTrack(seed, preferences.musicTone, rng);
  
  // 6. Seleccionar filtros visuales
  const visualFilters = selectVisualFilters(seed, rng);
  
  // 7. Calcular duración total
  const totalDuration = calculateTotalDuration(sequenceWithTransitions, musicTrack);
  
  // 8. Convertir nombres de videos a IPFS CIDs (lookup table)
  const ipfsCids = await mapVideosToIPFS(sequenceWithTransitions);
  
  return {
    seed,
    gender: preferences.gender,
    perspective: preferences.perspective,
    musicTone: preferences.musicTone,
    videoSequence: ipfsCids,
    musicTrack: await mapMusicToIPFS(musicTrack.track),
    visualFilters,
    totalDuration,
    metadata: {
      createdAt: timestamp,
      version: '1.0'
    }
  };
}
```

---

## 🗂️ Lookup Tables (Mappeo Nombres → IPFS CIDs)

Se almacenan en base de datos o archivo de configuración:

```json
{
  "videos": {
    "FEM_A_v1.mp4": "QmXxX1111...",
    "FEM_A_v2.mp4": "QmXxX2222...",
    "FEM_B_v3.mp4": "QmXxX3333...",
    "transition_glitch.mp4": "QmXxX4444...",
    "DUOS_MIXED_01.mp4": "QmXxX5555...",
    "GROUP_ENSEMBLE_01.mp4": "QmXxX6666..."
  },
  "music": {
    "melancholic_01.mp3": "QmYyY1111...",
    "joyful_01.mp3": "QmYyY2222...",
    "abstract_01.mp3": "QmYyY3333...",
    "ambient_01.mp3": "QmYyY4444..."
  }
}
```

---

## 📊 Estadísticas de Variabilidad

```
Combinaciones posibles (aproximado):

Solos: 3 géneros × 8-40 videos = ~400 combinaciones de acto
Transiciones: 8 tipos de transiciones
Dúos/Grupos: 20 combinaciones adicionales
Música: 4 tonos × ~4 tracks cada uno = 16 opciones
Filtros: 2^5 = 32 combinaciones de filtros

TOTAL: ~400 × 8 × 20 × 16 × 32 = 20.48 MILLONES de combinaciones únicas

Cada mint tiene probabilidad < 0.000005% de ser idéntico
```

---

## ✅ Verificación de Determinismo

Para verificar que el algoritmo es determinístico:

```javascript
const preferences = {
  gender: 'female',
  perspective: 'multiple_pov',
  musicTone: 'ambient'
};

const comp1 = await generateComposition(
  '0x123...abc',
  preferences,
  1708962000
);

const comp2 = await generateComposition(
  '0x123...abc',
  preferences,
  1708962000
);

console.assert(comp1.seed === comp2.seed, 'Seeds deben ser idénticos');
console.assert(
  JSON.stringify(comp1.videoSequence) === JSON.stringify(comp2.videoSequence),
  'Secuencias deben ser idénticas'
);
console.assert(comp1.musicTrack === comp2.musicTrack, 'Música debe ser idéntica');
```

**Resultado esperado:** ✅ Todos los asserts pasan

---

## 🔐 Immutabilidad en Blockchain

Una vez generada la composición:
1. Se crea metadata JSON con seed + videoSequence
2. Metadata se sube a IPFS (CID inmutable)
3. En mint, contrato almacena: tokenId → metadataURI (IPFS hash)
4. Blockchain verifica: Si intentas reproducir con mismo seed → obtienes mismos videos
5. Smart Contract emite evento: `Minted(tokenId, user, seed)` (auditable)

---

## 📚 Referencias

- Seeded randomness: https://en.wikipedia.org/wiki/Pseudorandom_number_generator
- ERC-721 metadata: https://eips.ethereum.org/EIPS/eip-721
- IPFS immutability: https://docs.ipfs.tech/concepts/content-addressing/

