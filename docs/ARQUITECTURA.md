# ARQUITECTURA - VIDEODANZA GENERATIVA NFT

## 🎯 Visión General

Plataforma de experiencias interactivas de videodanza donde cada NFT mint genera una combinación única de videos, música y narrativa basada en blockchain.

```
┌─────────────────────────────────────────────────────────────┐
│                     USUARIO EN NAVEGADOR                      │
│                  (Frontend React + TypeScript)               │
└────────────────────────┬────────────────────────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌──────┐        ┌──────────┐    ┌──────────┐
    │ Web3 │        │ Selector │    │ Playback │
    │ Auth │        │ UI       │    │ Engine   │
    └──────┘        └──────────┘    └──────────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │      BACKEND API (Next.js)      │
        │                                 │
        │  ┌────────────────────────────┐ │
        │  │ Generative Engine          │ │
        │  │ - Algoritmo combinatorio   │ │
        │  │ - Seed determinístico      │ │
        │  └────────────────────────────┘ │
        │                                 │
        │  ┌────────────────────────────┐ │
        │  │ Service Layer              │ │
        │  │ - Pinata (IPFS)            │ │
        │  │ - Blockchain              │ │
        │  │ - Video Composition        │ │
        │  └────────────────────────────┘ │
        └────────────────┬────────────────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    ┌──────────┐   ┌───────────┐   ┌────────────┐
    │  PINATA  │   │   BASE    │   │   MEDIA    │
    │  IPFS    │   │ BLOCKCHAIN│   │   LIBRARY  │
    │          │   │ (ERC-721) │   │ (Videos)   │
    └──────────┘   └───────────┘   └────────────┘
```

---

## 🏗️ Stack Técnico

| Capa          | Tecnología                  | Propósito                      |
|---------------|-----------------------------|---------------------------------|
| Frontend      | React 18 + TypeScript       | UI interactiva                 |
| Estilo        | Tailwind + Framer Motion    | Diseño responsivo + animaciones|
| Backend       | Next.js 14 (App Router)     | API + generación             |
| Blockchain    | Solidity (ERC-721)          | Contrato de NFT               |
| Red           | Base (Mainnet + Testnet)    | Transacciones L2 económicas   |
| IPFS          | Pinata Cloud                | Almacenamiento de contenido   |
| Web3          | Wagmi + Viem                | Conexión blockchain           |
| Video         | FFmpeg (Node.js)            | Procesamiento de video        |
| Música        | Web Audio API               | Sincronización audio/video    |
| Deploy        | Vercel                      | Hosting frontend + backend    |

---

## 📊 Flujo de Datos Completo

### 1️⃣ **Etapa: Selección de Preferencias**
```
Usuario selecciona:
├─ Género/Personaje (he, she, hybrid, avatar1, avatar2, avatar3)
├─ Perspectiva (dancer_pov, spectator_pov, multiple_pov)
└─ Música (melancholic, joyful, abstract, ambient)
       │
       ▼
  Frontend envía a /api/generate
```

### 2️⃣ **Etapa: Generación Única (Backend)**
```
Backend (/api/generate):
├─ Recibe parámetros de usuario
├─ Genera SEED = hash(timestamp + wallet + params)
├─ Usa SEED para:
│  ├─ Seleccionar secuencia de videos determinística
│  ├─ Escoger transiciones específicas
│  ├─ Determinar duración total
│  └─ Seleccionar filtros visuales
├─ Crea METADATA JSON {
│    "seed": "0x...",
│    "gender": "she",
│    "perspective": "multiple_pov",
│    "musicTone": "ambient",
│    "videoSequence": ["ipfs://Qm...", ...],
│    "totalDuration": 450,
│    "filters": ["glitch", "thermal"],
│    "timestamp": 1708...,
│    "artist": "VideoDanza Generativa"
│  }
├─ Sube METADATA a IPFS (retorna METADATA_CID)
└─ Retorna { seed, metadataCID, videoSequence, musicTrack }
```

### 3️⃣ **Etapa: Reproducción en Frontend**
```
Frontend recibe composición:
├─ Obtiene video CIDs desde IPFS Gateway (Pinata)
├─ Carga progresivamente primeros 2 videos
├─ Sincroniza pista de música con Web Audio API
├─ Renderiza VideoPlayer component:
│  ├─ Streaming desde IPFS
│  ├─ Transiciones suaves
│  ├─ Botones de interactividad (opcional: cambiar música/dirección)
│  └─ Información de metadata visible
└─ Usuario puede REPRODUCIR, PAUSAR, COMPARTIR
```

### 4️⃣ **Etapa: Minting NFT**
```
Usuario hace clic en "MINT NFT":
├─ Frontend valida Web3 wallet conectada
├─ Prepara datos para mint:
│  ├─ metadataURI = "ipfs://METADATA_CID"
│  └─ seed = "0x..." (para reproducibilidad)
├─ Llama contrato VideoDanzaNFT.mint(metadataURI, seed)
├─ Blockchain:
│  ├─ Verifica fondos (costo: ~0.001 ETH)
│  ├─ Acuña token ERC-721 único
│  ├─ Almacena metadataURI en onchain
│  ├─ Emite evento Minted(tokenId, user, seed)
│  └─ Retorna tokenId
├─ Frontend muestra confirmación + link al token
└─ Token guardado en wallet del usuario (Etherscan + Opensea)
```

---

## 🗂️ Estructura de Datos - IPFS/Pinata

### Carpetas principales en Pinata:

```
pinata://videodanza/
├── videos/
│  ├── solos/
│  │  ├── female_01.mp4 (IPFS CID 1)
│  │  ├── female_02.mp4 (IPFS CID 2)
│  │  ├── male_01.mp4
│  │  └── ... (20+ videos)
│  ├── duos/
│  │  ├── dance_pair_01.mp4
│  │  └── ... (10+ videos)
│  ├── group/
│  │  └── ... (ensemble videos)
│  └── transitions/
│     ├── fade.mp4
│     ├── glitch_transition.mp4
│     └── ... (5+ transiciones)
│
├── music/
│  ├── melancholic/
│  │  ├── track_01.mp3 (BPM: 80)
│  │  └── track_02.mp3
│  ├── joyful/
│  │  ├── track_01.mp3 (BPM: 120)
│  │  └── track_02.mp3
│  ├── abstract/
│  │  └── ... (ambient/experimental)
│  └── ambient/
│     └── ... (environmental soundscapes)
│
└── metadata/
   ├── nft_01.json (contenido: { seed, videoSequence, musicTrack, ... })
   ├── nft_02.json
   └── ... (cada mint crea un nuevo metadata.json)
```

**Ejemplo de metadata.json en IPFS:**
```json
{
  "name": "VideoDanza #2847",
  "description": "Experiencia generativa única de videodanza interactiva",
  "image": "ipfs://QmVideoThumbnail...",
  "animation_url": "https://videodanza-app.vercel.app/watch?seed=0x...",
  "attributes": [
    { "trait_type": "Gender", "value": "feminine" },
    { "trait_type": "Perspective", "value": "multiple_pov" },
    { "trait_type": "Music Tone", "value": "ambient" },
    { "trait_type": "Duration (seconds)", "value": "450" },
    { "trait_type": "Visual Filters", "value": "glitch, thermal" },
    { "trait_type": "Total Clips", "value": "7" }
  ],
  "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
  "videoSequence": [
    "ipfs://QmVideo1...",
    "ipfs://QmVideo2...",
    "ipfs://QmTransition1...",
    "ipfs://QmVideo3..."
  ],
  "musicTrack": "ipfs://QmMusicTrack...",
  "createdAt": 1708962000,
  "artist": "VideoDanza Generativa",
  "version": "1.0"
}
```

---

## 🎲 Algoritmo Generativo (Determinístico)

Ver documento separado: `ALGORITMO_GENERATIVO.md`

**Resumen:**
- Seed = hash(timestamp + wallet + preferences)
- Seed alimenta pseudo-random determinístico (seeded Math.random)
- Mismo seed = misma secuencia de videos siempre
- Permite reproducibilidad + verificación en blockchain

---

## 📱 Componentes Frontend

```
App/
├── pages/
│  ├── _app.tsx              (Provider Web3, theme)
│  ├── index.tsx             (Landing)
│  ├── app.tsx               (Selector UI)
│  ├── watch.tsx             (Video player)
│  ├── nft-gallery.tsx       (Mis NFTs)
│  └── about.tsx             (Info)
│
├── components/
│  ├── PreferenceSelector/
│  │  ├── GenderPicker.tsx
│  │  ├── PerspectivePicker.tsx
│  │  ├── MusicTonePicker.tsx
│  │  └── GenerateButton.tsx
│  │
│  ├── VideoPlayer/
│  │  ├── Player.tsx
│  │  ├── VideoLoader.tsx
│  │  ├── MusicSync.tsx
│  │  └── TransitionEffect.tsx
│  │
│  ├── MintFlow/
│  │  ├── MintButton.tsx
│  │  ├── MintModal.tsx
│  │  ├── ConfirmationStep.tsx
│  │  └── SuccessScreen.tsx
│  │
│  ├── NFTGallery/
│  │  ├── GalleryGrid.tsx
│  │  ├── NFTCard.tsx
│  │  └── DetailModal.tsx
│  │
│  └── Common/
│     ├── Header.tsx
│     ├── Footer.tsx
│     ├── LoadingSpinner.tsx
│     └── ErrorBoundary.tsx
│
├── hooks/
│  ├── useGenerativeEngine.ts   (Genera composición)
│  ├── useVideoPlayer.ts         (Sincroniza video+audio)
│  ├── usePinataGateway.ts       (Carga desde IPFS)
│  ├── useWeb3Auth.ts            (Wallet connection)
│  ├── useNFTMint.ts             (Minting logic)
│  └── useSeeding.ts             (Seed generation)
│
├── utils/
│  ├── seedGenerator.ts          (Hash + determinismo)
│  ├── ipfsGateway.ts            (URLs de Pinata)
│  ├── contractABI.ts            (ABI ERC-721)
│  └── constants.ts              (Config blockchain)
│
├── styles/
│  ├── globals.css               (Tailwind)
│  ├── VideoPlayer.module.css    (Animaciones)
│  └── theme.ts                  (Color tokens)
│
└── public/
   ├── logo.svg
   └── ...
```

---

## 🔗 Contrato Inteligente (ERC-721)

**Ubicación:** `smart-contracts/contracts/VideoDanzaNFT.sol`

**Propiedades:**
- Estándar: ERC-721 (NFT no fungible)
- Red: Base (8453) + Base Testnet (84532)
- Max Supply: Ilimitado (cada mint es único)
- Metadata: URL a IPFS (almacena seed + composición)
- Royalties: 7.5% en secundarias (ERC-2981)

**Funciones principales:**
```solidity
function mint(string calldata metadataURI, bytes32 seed) external payable
function getSeed(uint256 tokenId) external view returns (bytes32)
function updateMetadata(uint256 tokenId, string calldata newURI) external
function withdraw() external onlyOwner
```

Ver documento: `CONTRATOS.md`

---

## 🌐 API Backend (Next.js)

**Ubicación:** `backend/api/` y rutas en `pages/api/`

### Endpoints principales:

| Método | Ruta                     | Descripción                              |
|--------|--------------------------|------------------------------------------|
| POST   | `/api/generate`          | Genera composición única con seed       |
| GET    | `/api/composition/:seed` | Recupera composición existente           |
| POST   | `/api/ipfs/upload`       | Sube metadata a IPFS (Pinata)           |
| GET    | `/api/ipfs/metadata/:cid`| Obtiene metadata desde IPFS             |
| POST   | `/api/mint/prepare`      | Prepara datos para mint en blockchain   |
| GET    | `/api/nfts/:wallet`      | Lista NFTs del usuario                  |
| GET    | `/api/health`            | Health check                            |

Ver documento: `API.md`

---

## 🎬 Flujo de Video

### Procesamiento:
1. **Upload:** Videos se suben a Pinata via API
2. **Indexing:** Se registran CIDs en base de datos local
3. **Serving:** Se sirven desde Pinata Gateway (rápido)
4. **Caching:** Browser cachea después de descarga

### Sincronización Audio/Video:
```typescript
// Web Audio API + requestAnimationFrame
videoElement.currentTime = audioContext.currentTime;
audioBuffer.connect(audioContext.destination);
animationFrame = requestAnimationFrame(sync);
```

### Transiciones:
- Cross-fade (0.5s)
- Glitch effect (temporal distortion)
- Blackout + fade-in

---

## 🔐 Seguridad & Validaciones

### Frontend:
- Web3 Auth: Verificar firma de wallet
- Input validation: Parámetros de usuario sanificados
- CORS: Solo dominio Vercel permitido

### Backend:
- Rate limiting: 100 requests/min por IP
- Validación de seed: Verificar hash válido
- IPFS pinning: Verificar CIDs existentes antes de referenciar
- Errores silenciosos para evitar enumeration attacks

### Blockchain:
- ERC-721 estándar (OpenZeppelin)
- Verificación de fondos antes de mint
- Eventos inmutables en blockchain
- Metadata immutable (IPFS hash)

---

## 📈 Escalabilidad

### Base Testnet → Mainnet:
- Deployment script con verificación
- Inicialización de videos en IPFS
- Marketing del contrato en exploradores

### Optimizaciones IPFS:
- Pinata Pro para uptime 99.9%
- Replicación en múltiples nodos
- Gateway CDN para latencia < 500ms

### Carga en Frontend:
- Code splitting: Lazy load componentes de video
- Image optimization: Compresión de thumbnails
- Prefetching: Precarga próximos videos en background

---

## 🚀 Roadmap de Fases

- **Fase 0:** Arquitectura ✅ (Este documento)
- **Fase 1:** Contrato ERC-721 + IPFS setup
- **Fase 2:** Backend + Generative engine
- **Fase 3:** Frontend React
- **Fase 4:** Interactividad avanzada
- **Fase 5:** Web3 integration + mint
- **Fase 6:** Optimización y deploy

---

## 📞 Puntos de Referencia

- Artículo sobre ERC-721: https://ethereum.org/en/developers/docs/standards/tokens/erc-721/
- Pinata API: https://docs.pinata.cloud
- Base Blockchain: https://docs.base.org
- Wagmi Hooks: https://wagmi.sh

