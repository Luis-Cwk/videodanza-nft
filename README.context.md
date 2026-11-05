# VideoDanza NFT — Contexto Técnico Profundo

> Documento de referencia técnica para agentes y colaboradores.
> Última revisión: 4 de junio de 2026.
> Lee esto antes de modificar cualquier parte del proyecto.

---

## 1. Visión General

**VideoDanza NFT** es una plataforma de NFTs generativos de videodanza en Ethereum Sepolia. El usuario introduce una **semilla** (frase libre) que se hashea con keccak256 y se usa para generar determinísticamente una composición de video: 5–25 capas (clips) tomadas de 64 videos fuente (serie *ToReturnHome*), cada una con posición, escala, opacidad, rotación, blend mode y timing propios.

El resultado es único por semilla, reproducible, verificable on-chain y permanente.

### Flujo del usuario
1. Conectar wallet (wagmi + RainbowKit) en Sepolia.
2. En `/mint` escribir una semilla (ej. `mi-semilla-unica-2026`).
3. El cliente hashea la semilla y resuelve la composición en navegador.
4. Vista previa (`VideodanzaPlayer` con crossfade) muestra la pieza.
5. Botón "Acuñar VideoDanza" dispara `POST /api/mint-metadata` → Pinata → `mint(seed, metadataUrl, 0.001 ETH)`.
6. El NFT aparece en `/gallery` y se reconstruye desde `tokenIdToSeed`.

### Componentes del sistema
- **Frontend** Next.js 14 (App Router), React 18, TypeScript, wagmi, ethers.js, RainbowKit, Tailwind (no se usa activamente, todo en `globals.css`).
- **Backend** Rutas API de Next.js: `POST /api/mint-metadata`, `GET /api/video-proxy`.
- **Blockchain** Contrato `VideoDanzaNFT` (ERC-721 + ERC-2981 + Ownable) en Ethereum Sepolia.
- **Almacenamiento** 64 videos en IPFS (gateway Filebase) y metadatos JSON nuevos en Pinata por cada mint.
- **Minting determinista** Generación 100% en el cliente; `seed → composition` es función pura.

---

## 2. Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14 + React 18)             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   /mint      │  │  /gallery    │  │   /agent     │              │
│  │  MintCard    │  │  Gallery     │  │  A2A Chat    │              │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘              │
│         │                 │                 │                       │
│         └─────────────────┼─────────────────┘                       │
│                           ▼                                         │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  CAPA DE HOOKS                                                │  │
│  │  • useGenerativeComposition(seed) → composición determinista  │  │
│  │  • useContract (wagmi) → mint, getSeed, tokenURI              │  │
│  │  • useIPFSLookupTable → 64 CIDs cargados desde JSON público  │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            ┌──────────────┐           ┌──────────────┐
            │  BACKEND     │           │  BLOCKCHAIN  │
            │  (Next.js    │           │  (Ethereum   │
            │  API Routes) │           │  Sepolia)    │
            │              │           │              │
            │ POST /api/   │           │ VideoDanzaNFT │
            │ mint-metadata│           │ 0xe3145Ad5... │
            │ → Pinata     │           │              │
            │              │           │              │
            │ GET /api/    │           │              │
            │ video-proxy  │           │              │
            └──────────────┘           └──────────────┘
```

---

## 3. Smart Contract

### Dirección
- `0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828` (Ethereum Sepolia, Chain ID `11155111`)
- Nota: `smart-contracts/deployments/sepolia.json` muestra `0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf` como dirección histórica. La dirección **activa en el frontend** es `0xe3145Ad5...`.

### Estándares y herencias
- ERC-721 (OpenZeppelin v5)
- ERC-2981 (royalties 7.5% al owner)
- Ownable (OpenZeppelin v5, `Ownable2Step` no usado)
- Solidity `0.8.20`, optimizador habilitado (200 runs)

### Estado on-chain

| Mapeo | Tipo | Propósito |
|------|------|-----------|
| `tokenIdToSeed[uint256]` | `mapping(uint256 => bytes32)` | Reproducibilidad |
| `_seedMinted[bytes32]` | `mapping(bytes32 => bool)` | Anti-duplicados |
| `_tokenURIs[uint256]` | `mapping(uint256 => string)` | URI IPFS de metadatos |
| `tokenIdToOwner[uint256]` | `mapping(uint256 => address)` | Ownership |
| `ownerOf[uint256]` | ERC721 | Ownership estándar |

### Eventos

| Evento | Firma | Cuándo |
|--------|-------|--------|
| `Minted(uint256 tokenId, address to, bytes32 seed, string metadataURI)` | En cada mint |
| `MetadataUpdated(uint256 tokenId, string newURI)` | Cuando el owner del token actualiza metadata |
| `MintPriceUpdated(uint256 newPrice)` | Cuando el owner cambia el precio |
| `Withdrawn(address to, uint256 amount)` | Cuando el owner retira fondos |
| `Transfer`, `Approval`, `ApprovalForAll` | ERC-721 estándar |

### Funciones externas principales

```solidity
// Usuario (payable)
function mint(string metadataURI, bytes32 seed) external payable returns (uint256)

// Lectura (view)
function getSeed(uint256 tokenId) external view returns (bytes32)
function isSeedMinted(bytes32 seed) external view returns (bool)
function totalSupply() external view returns (uint256)
function mintPrice() external view returns (uint256)
function tokenIdToSeed(uint256) external view returns (bytes32)
function tokenURI(uint256) external view returns (string)
function royaltyInfo(uint256, uint256 salePrice) external view returns (address, uint256)

// Owner only
function updateMetadata(uint256 tokenId, string newURI) external
function updateMintPrice(uint256 newPrice) external
function withdraw() external
function transferOwnership(address) external
function renounceOwnership() external
```

### Reglas de validación en `mint()`
- `metadataURI` no puede estar vacío (`"VideoDanzaNFT: Metadata URI required"`)
- `msg.value >= mintPrice` (`"VideoDanzaNFT: Insufficient payment"`)
- `seed` no debe estar minteado (`"VideoDanzaNFT: Seed already minted"`)

### Tests
- `smart-contracts/test/VideoDanzaNFT.test.js` cubre: deployment, minting (válido/duplicado/pago/URI vacío/incremento IDs/evento), seed management, metadata, precios, royalties 7.5%, fondos y `withdraw`, ERC-721 estándar, transferencia.
- Se ejecutan con `npx hardhat test`.

### Deploy
```bash
cd smart-contracts
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network sepolia
# o con la red configurada
npm run deploy:sepolia
```

---

## 4. Algoritmo Generativo

Archivo: `frontend/lib/hooks/useGenerativeComposition.ts`

### PRNG (Pseudo-Random Number Generator)
Tipo: **Linear Congruential Generator (LCG)** determinista, no criptográficamente seguro.

```typescript
class SeededRandom {
  // El seed se inicializa con los 8 primeros hex chars del seed (sin '0x')
  constructor(seedStr: string) {
    this.seed = parseInt(seedStr.slice(2, 10), 16) || 0
  }
  private next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }
}
```

⚠️ **Limitación**: solo 24 bits de espacio inicial. Para aumentar entropía se podría usar `BigInt` del keccak256 completo. Aceptable para el caso de uso (uniqueness viene de las combinaciones de videos, no del RNG).

### Datos generados por composición

| Campo | Tipo | Origen |
|-------|------|--------|
| `seed` | `bytes32` | Entrada |
| `theme` | enum (7 valores) | `geometric`, `organic`, `hybrid`, `glitch`, `cinematic`, `abstract`, `kinetic` |
| `layerCount` | int | 5–min(25, videos disponibles) |
| `elements` | CompositionElement[] | Selección única de videos + parámetros por capa |
| `totalDuration` | float | máx(endTime de capas), mínimo 10s |
| `backgroundIntensity` | float | 0.05–0.9 |
| `colorShift` | float | 0–360 (HSL hue rotation en metadata) |
| `audioIntensity` | float | 0.3–1.0 |
| `hash` | string | primeros 16 chars del seed |

### Parámetros por capa (`CompositionElement`)

| Campo | Rango | Significado |
|-------|-------|-------------|
| `videoKey` | string | nombre del archivo de video |
| `videoName` | string | versión legible |
| `ipfsUri` | string | `ipfs://CID` |
| `startTime` | float | segundos desde inicio de la composición |
| `duration` | float | 1–8s (base 2–6 + varianza) |
| `scale` | float | 0.4–2.0 |
| `opacity` | float | 0.2–1.0 |
| `rotation` | float | 0–360° |
| `positionX` | float | -30 a 130 (% del canvas) |
| `positionY` | float | -30 a 130 (% del canvas) |
| `blendMode` | string | uno de 11 (normal, multiply, screen, overlay, color-dodge, darken, lighten, soft-light, hard-light, difference) |
| `effectId` | int | 0–8 (placeholder, no usado en player) |
| `zIndex` | int | índice secuencial |

### Timing encadenado
```typescript
currentTime += duration * (0.3 + rng.range(-0.15, 0.3))
```
Genera solapamiento dinámico entre capas.

### Determinismo
- Misma semilla + misma IPFS Lookup Table → misma composición exacta.
- El campo `seed` se almacena on-chain (`tokenIdToSeed`) para verificación.

---

## 5. Video Player

Archivo: `frontend/components/player/VideodanzaPlayer.tsx`

### Dual-video crossfade
- Dos elementos `<video>` (A y B) comparten el mismo contenedor.
- Solo uno está visible (`opacity: 1`); el otro está en `opacity: 0`.
- Cuando el activo termina (`onEnded`) → crossfade de 600ms → roles se intercambian.
- El siguiente video se precarga en el inactivo antes de iniciar.

### Queue determinista
```typescript
function buildQueue() {
  if (cycleRef.current === 0) return [...urls] // orden original
  const seed = `${cycleRef.current}-${elements[0]?.ipfsUri}`
  return seededShuffle(urls, seed)
}
```
- Primer ciclo: orden original de las capas.
- Siguientes ciclos: shuffle determinista por hash de (cycle + primer CID).

### Audio unlock
- Por política de autoplay, el navegador exige interacción del usuario.
- En el modal/gallery con `hoverSound={true}`: el video reproduce en hover y pausa al salir.
- Sin `hoverSound`: muestra botón "▶" para desbloquear audio manualmente.

### Props
```typescript
interface VideodanzaPlayerProps {
  elements: CompositionElement[]
  style?: React.CSSProperties
  autoPlay?: boolean
  muted?: boolean
  hoverSound?: boolean
}
```

### Proxy IPFS
Todas las URLs de video pasan por `/api/video-proxy?uri=ipfs://...` que intenta 6 gateways con timeout de 10s:
1. `https://ipfs.filebase.io/ipfs`
2. `https://gateway.pinata.cloud/ipfs`
3. `https://nftstorage.link/ipfs`
4. `https://dweb.link/ipfs`
5. `https://cloudflare-ipfs.com/ipfs`
6. `https://ipfs.io/ipfs`

Cache-Control: `public, max-age=86400` (1 día).

---

## 6. IPFS Lookup Table

Archivo: `frontend/public/ipfs_lookup_table.json`

### Estructura
```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contractAddress": "0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828",
  "gateway": "https://ipfs.filebase.io/ipfs",
  "videos": {
    "ToReturnHome (1).mov": {
      "cid": "QmRogmfMhjXMb4yEv7cwdrPukBUX9cb5oXfpi4gFH1FotD",
      "ipfs": "ipfs://QmRogmfMhjXMb4yEv7cwdrPukBUX9cb5oXfpi4gFH1FotD",
      "gateway": "https://ipfs.filebase.io/ipfs/QmRogmfMhjXMb4yEv7cwdrPukBUX9cb5oXfpi4gFH1FotD"
    },
    ...
  }
}
```

### Datos
- **64 videos** (`ToReturnHome (1).mov` … `ToReturnHome (64).mov`)
- ⚠️ **Duplicado**: el video 64 tiene el mismo CID que el 63 (`QmaeFCjgsMRPutJdUhrtZ9nKhTnb93gjrYvs81FjhzVRNW`). Se recomienda revisar y re-subir.
- Cargado client-side con `cache: 'no-store'` (desactivar caché para ver updates).
- Cacheado en variable de módulo (`lookupTableCache`) para evitar refetch.

### Hooks
- `useIPFSLookupTable()` → devuelve `{ videos, gateway, loading, error }`.
- `useIPFSVideo(videoName)` → devuelve `{ cid, url, loading, error }` para un video.
- `getIPFSUrl(cid, gateway?)` → helper de URL.

---

## 7. Flujo de Mint

Archivos clave:
- `frontend/components/mint/MintCard.tsx`
- `frontend/app/api/mint-metadata/route.ts`
- `frontend/lib/hooks/useContract.ts`
- `frontend/lib/contracts/config.ts`

### Paso a paso

```
[USUARIO] escribe "mi-semilla-2026"
         │
         ▼
[MintCard] watch('seedPhrase') → useEffect
         │
         │  ethers.keccak256(toUtf8Bytes(seedPhrase))
         ▼
      seed: 0x9f2a... (bytes32)
         │
         │  checkIfSeedMinted(seed) en contrato
         ▼
      { isSeedMinted: false }
         │
         │  useGenerativeComposition(seed) en navegador
         ▼
      GenerativeComposition (con elements, theme, etc.)
         │
         │  Render preview con <GenerativePreview />
         ▼
[USUARIO] click "Acuñar VideoDanza"
         │
         │  onSubmit → POST /api/mint-metadata
         │  body: { seed, seedPhrase, composition }
         ▼
[API ROUTE] construye metadata JSON:
{
  name: "VideoDanza #<random>",
  description: "Pieza generativa de videodanza.",
  image: "ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb",
  animation_url: "<APP_ORIGIN>/agent?seed=<encoded>",
  attributes: [
    { trait_type: "Seed", value: seedPhrase || seed },
    { trait_type: "Theme", value: composition.theme },
    { trait_type: "Layer Count", value: layerCount }
  ]
}
         │
         │  fetch Pinata: POST https://api.pinata.cloud/pinning/pinJSONToIPFS
         ▼
      { IpfsHash: "Qm..." }
         │
         │  Responde { success, metadataUrl: "ipfs://...", cid, metadata }
         ▼
[MintCard] await mint(seed, metadataUrl, 0.001 ETH)
         │
         │  wagmi writeContract → MetaMask
         ▼
[CONTRATO] mint(metadataURI, seed) payable
   - require(msg.value >= mintPrice)
   - require(_seedMinted[seed] == false)
   - _safeMint(msg.sender, tokenId)
   - tokenIdToSeed[tokenId] = seed
   - _seedMinted[seed] = true
   - _tokenURIs[tokenId] = metadataURI
   - emit Minted(tokenId, msg.sender, seed, metadataURI)
         │
         ▼
[USUARIO] ve success message con link a Etherscan Sepolia
```

### Validaciones de seguridad implementadas
- Verificación local de `isSeedMinted` antes de gastar gas.
- Verificación on-chain en el contrato (revierte con string error).
- Contrato payable solo si `msg.value >= mintPrice`.

### Variables de entorno requeridas (Vercel)
```
PINATA_API_KEY=<secret>
PINATA_API_SECRET=<secret>
NEXT_PUBLIC_PINATA_JWT=<public-optional>
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.filebase.io/ipfs
NEXT_PUBLIC_SITE_URL=https://<tu-dominio>.vercel.app
```

---

## 8. Galería

Archivo: `frontend/components/gallery/Gallery.tsx`

### Lectura
```typescript
const total = await contract.totalSupply()
for (let i = 0; i < total; i++) {
  const seed = await contract.tokenIdToSeed(i)
  nftsData.push({ tokenId: i, seed })
}
```

### Proveedores (con fallback)
1. `https://ethereum-sepolia.publicnode.com` (RPC público)
2. `https://sepolia.drpc.org` (RPC público)
3. `window.ethereum` (MetaMask del usuario)

Delay de 200ms entre llamadas para no saturar el RPC público.

### Render
- Grid responsive: `repeat(auto-fill, minmax(280px, 1fr))`.
- Cada `NFTCard` reproduce la composición con `hoverSound={true}` (audio al hover, pausa al salir).
- Click → `NFTModal` con video en primer plano + stats (theme, capas, duración, audioIntensity) + lista de videos usados + seed en monospace.

### Modal en móvil
`globals.css` define `max-width: 480px` que transforma el modal en pantalla completa (100vh, video sticky en top, scroll vertical para stats).

---

## 9. Configuración y Constantes

### `frontend/lib/contracts/config.ts`
```typescript
export const CONTRACT_ADDRESS = '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828' as const
export const CHAIN_ID = 11155111 as const // Sepolia
export const MINT_PRICE = '0.001' // ETH
export const ROYALTY_PERCENTAGE = 7.5

export const SEPOLIA_CHAIN_CONFIG = {
  id: 11155111,
  name: 'Ethereum Sepolia',
  rpcUrls: { default: { http: ['https://ethereum-sepolia.publicnode.com'] } },
  blockExplorers: { default: { name: 'Etherscan', url: 'https://sepolia.etherscan.io' } },
  testnet: true,
}
```

### `smart-contracts/hardhat.config.js`
- **Solidity**: `0.8.20` con optimizador (200 runs).
- **Networks**:
  - `hardhat` (local, 31337)
  - `sepolia` (11155111)
  - `baseSepolia` (84532)
  - `baseMainnet` (8453)
- **Etherscan API key** compartida para todas las redes.
- Lee `PRIVATE_KEY`, `SEPOLIA_RPC`, `BASE_SEPOLIA_RPC`, `BASE_MAINNET_RPC`, `ETHERSCAN_API_KEY` desde `../.env.local`.

### `frontend/next.config.js`
- Imágenes: `gateway.pinata.cloud`, `ipfs.io`, `cloudflare-ipfs.com` permitidos.
- Formatos: `image/avif`, `image/webp`.
- `Cache-Control: max-age=31536000, immutable` para `/static/`.
- Webpack splitChunks personalizado para framework y vendors.

### `frontend/globals.css` (sistema de diseño)
- **Estilo**: Swiss Grid FUI (functional UI). Tipografías JetBrains Mono y Space Grotesk.
- **Variables CSS** (`--accent: #0066ff`, `--bg: #ffffff`, etc.).
- **Componentes**: `.nft-card`, `.modal-overlay`, `.btn-fui`, `.btn-fui-primary`, `.stats-grid`, `.data-panel`, `.feature-card`, `.telemetry`.
- **Responsive**: 3 breakpoints (`max-width: 1024px`, `768px`, `480px`).
- **Mobile modal**: fullscreen con video sticky en top.

---

## 10. Decisiones Técnicas Clave

| Decisión | Razón |
|----------|-------|
| **Generación client-side** | No requiere motor generativo en backend; funciona offline. |
| **Determinismo por keccak256** | Misma seed → misma composición verificable. |
| **IPFS para medios** | Descentralizado; videos y metadatos son públicos y permanentes. |
| **Pinata por mint** | Cada NFT tiene su propio JSON de metadatos con `animation_url` al `agent`. |
| **Video proxy con fallback** | 6 gateways probados secuencialmente con timeout; 404 si todos fallan. |
| **Dual-video player** | Crossfade sin gap perceptible; precarga continua. |
| **Sepolia testnet** | Entorno seguro para iteración; mismo ABI en mainnet. |
| **ERC-2981 al 7.5%** | Estándar de royalties en marketplaces (OpenSea, etc.). |
| **Seed duplicado en contrato** | Previene que dos mints generen la misma pieza. |
| **IPFS Lookup Table local** | Frontend no depende de contrato para resolver videos. |

---

## 11. Issues / Gaps Conocidos

| Área | Problema | Archivo | Severidad |
|------|----------|---------|-----------|
| **Address mismatch** | `sepolia.json` y frontend usan direcciones diferentes | `smart-contracts/deployments/sepolia.json` | Media |
| **CID duplicado** | Video 63 y 64 tienen el mismo `QmaeFCjgsMRPutJdUhrtZ9nKhTnb93gjrYvs81FjhzVRNW` | `public/ipfs_lookup_table.json:163, 178` | Media |
| **Metadata name aleatorio** | `Math.floor(Math.random() * 100000)` no es determinista | `app/api/mint-metadata/route.ts:32` | Alta |
| **No audio/música** | `audioIntensity` calculado pero no usado en el player | `useGenerativeComposition.ts:165` | Media |
| **Sin transiciones de capa** | Docs mencionan glitch/morph/fade; player solo crossfades | `VideodanzaPlayer.tsx` | Baja |
| **Sin verificación on-chain** | El contrato no valida que la composición coincida con el seed | Contrato | Baja (es trust-based) |
| **LCG 24-bit** | Solo 24 bits de entropía inicial; no criptográficamente seguro | `useGenerativeComposition.ts:38` | Baja |
| **API key con `Math.random`** | El número aleatorio puede colisionar entre mints | `mint-metadata/route.ts:32` | Alta |
| **Sin timeout en Pinata** | Si Pinata se cuelga, no hay timeout (puede quedar colgado) | `mint-metadata/route.ts:43` | Baja |
| **Sin tests de frontend** | Solo hay tests de smart contract | `smart-contracts/test/` | Media |
| **Image placeholder** | Todas las NFTs usan el mismo `QmajZaDfCnZz...` (placeholder) | `mint-metadata/route.ts:34` | Alta |
| **RPC público frágil** | Depende de `publicnode.com` y `drpc.org` | `useIPFS.ts`, `Gallery.tsx` | Baja |

---

## 12. Cómo Ejecutar

### Frontend (desarrollo)
```bash
cd C:\Users\petra\videodanza-nft\frontend
npm install
npm run dev
# → http://localhost:3000
```

### Frontend (build y deploy Vercel)
```bash
npm run build
# O usar la skill de Vercel deploy (preferido en este proyecto)
```

### Smart Contracts
```bash
cd C:\Users\petra\videodanza-nft\smart-contracts
npm install
npx hardhat compile
npx hardhat test
npx hardhat run scripts/deploy.js --network sepolia
```

### Variables de entorno
Crear `videodanza-nft/.env.local` (no commitear):
```
# Deployment
PRIVATE_KEY=<hex-sin-0x>
SEPOLIA_RPC=https://ethereum-sepolia.publicnode.com
BASE_SEPOLIA_RPC=https://sepolia.base.org
BASE_MAINNET_RPC=https://mainnet.base.org
ETHERSCAN_API_KEY=<api-key>

# Frontend (Pinata)
PINATA_API_KEY=<pinata-key>
PINATA_API_SECRET=<pinata-secret>
NEXT_PUBLIC_PINATA_JWT=<pinata-jwt>
NEXT_PUBLIC_IPFS_GATEWAY=https://ipfs.filebase.io/ipfs
NEXT_PUBLIC_SITE_URL=https://<tu-dominio>.vercel.app
```

### Comandos útiles por proyecto

| Acción | Comando |
|--------|---------|
| Lint frontend | `cd frontend && npm run lint` |
| Type-check | `cd frontend && npm run type-check` |
| Tests contracts | `cd smart-contracts && npx hardhat test` |
| Deploy Vercel | usar skill `vercel-deploy` |

---

## 13. Puntos de Extensión

| Para añadir... | Modifica... |
|----------------|-------------|
| **Nuevo parámetro visual** (color, velocidad) | `CompositionElement` + lógica en `useGenerativeComposition` |
| **Nueva capa de audio** | Reproducir `audioIntensity` con Web Audio API; sincronizar con timer |
| **Nuevo video clip** | Subir a IPFS → añadir entrada en `ipfs_lookup_table.json` |
| **Merkle allowlist** | Modificar `VideoDanzaNFT.sol` con `MerkleProof` + storage de root; generar árbol desde CSV |
| **Arweave** | Reemplazar fetch a Pinata en `app/api/mint-metadata/route.ts` por `irys.xyz` o similar |
| **Persistente ID de mint** | Reemplazar `Math.random()` por hash determinista: `seedHash.slice(2, 8)` |
| **Transiciones de capa** | Añadir a `VideodanzaPlayer` lógica de transiciones (glitch, fade, morph) en `onEnded` |
| **Pretext UI** | Rediseñar `globals.css` con pretext; reemplazar componentes `data-panel`, `feature-grid` |
| **Indexador de eventos** | Crear API route que consuma `Minted` event log para vista de actividad |
| **Burn / edición** | Añadir función `burn(uint256 tokenId)` al contrato |

---

## 14. Mapa de Archivos

```
videodanza-nft/
├── README.md                              # Overview comercial
├── README.context.md                      # ← este archivo (contexto técnico)
├── TESTS-VERIFICATIONS-PROOFS.md          # Debug de mint y verificaciones
├── AGENTS.md                              # Manual de estilo de Petra
├── .env.local                             # Secrets (NO commitear)
├── .vercelignore                          # Exclusiones de Vercel
│
├── smart-contracts/
│   ├── contracts/VideoDanzaNFT.sol        # Contrato principal
│   ├── scripts/deploy.js                  # Script de deploy
│   ├── test/VideoDanzaNFT.test.js         # Tests Hardhat
│   ├── hardhat.config.js                  # Config de Hardhat
│   ├── deployments/sepolia.json           # Info de deploy
│   └── package.json
│
└── frontend/
    ├── app/
    │   ├── layout.tsx                     # Layout raíz
    │   ├── page.tsx                       # Home
    │   ├── mint/page.tsx                  # Página de mint
    │   ├── gallery/page.tsx               # Página de galería
    │   ├── agent/                         # Páginas de agente A2A
    │   └── api/
    │       ├── mint-metadata/route.ts     # POST → Pinata
    │       └── video-proxy/route.ts       # GET → IPFS proxy
    │
    ├── components/
    │   ├── player/VideodanzaPlayer.tsx    # Reproductor dual-video
    │   ├── gallery/Gallery.tsx            # Galería + NFTCard + NFTModal
    │   ├── mint/MintCard.tsx              # Formulario de mint
    │   ├── generative/GenerativePreview.tsx  # Vista previa
    │   └── ui/                            # Componentes UI base
    │
    ├── lib/
    │   ├── contracts/
    │   │   ├── config.ts                  # CONSTANTES
    │   │   ├── index.ts                   # Exporta ABI y address
    │   │   └── VideoDanzaNFT.abi.json     # ABI del contrato
    │   └── hooks/
    │       ├── useContract.ts             # Hooks wagmi
    │       ├── useGenerativeComposition.ts # Algoritmo generativo
    │       └── useIPFS.ts                 # IPFS lookup table
    │
    ├── public/
    │   └── ipfs_lookup_table.json         # 64 videos metadata
    │
    ├── globals.css                        # Sistema de diseño
    ├── next.config.js
    └── package.json
```

---

## 15. Convenciones del Proyecto

- **Tipografía**: JetBrains Mono (códigos) + Space Grotesk (párrafos).
- **Color principal**: `#0066ff` (azul accent), `#000000` (texto), `#888888` (muted).
- **Lenguaje UI**: español (es-MX). Ej: "Acuñar", "Semilla", "Vista Previa".
- **Nombres de archivo**: kebab-case para nuevos, PascalCase para componentes React.
- **Estructura de carpetas**: alineada con Next.js App Router; no reorganizar.
- **NO hardcodear** private keys, API keys, ni secretos en código. Usar `.env.local`.
- **NO enviar formularios** automáticamente. Las aplicaciones se llenan y se dejan pendientes.

---

## 16. Contexto del Autor

- **Petra** (Luis Betancourt Nuñez) — artista multidisciplinario y creative coder en CDMX.
- **Identidad**: no binario / They. 32 años.
- **Stack creativo**: TouchDesigner, SuperCollider, MediaPipe, Python, OpenCV, Three.js, Stable Diffusion, YOLO.
- **Filosofía**: "La tecnología es solo una extensión de lo que el cuerpo ya sabe".
- **Obras referenciales**: *Bodies That Dance Alone*, *Fase REM de una IA*, *Atractor*, *Kinetics of Bodies, Branches and Circuits*.
- **Tema artístico**: cuerpo, tecnología, soberanía de datos, simbiogénesis humano-máquina.

---

*Fin del documento. Para preguntas específicas, revisar primero la sección correspondiente antes de explorar el código.*
