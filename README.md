# VIDEODANZA GENERATIVA - NFT Platform

## 🎨 Descripción

Plataforma de experiencias interactivas de videodanza donde cada NFT mint genera una combinación única de videos, música y narrativa basada en blockchain.

```
Usuario selecciona preferencias
    ↓
Sistema generativo crea composición única (determinística)
    ↓
Usuario ve video en vivo desde IPFS
    ↓
Usuario mintea NFT en Base blockchain
    ↓
NFT con metadata inmutable en IPFS
```

---

## 🚀 Quick Start

### Requisitos Previos
- Node.js 18+
- npm o yarn
- Wallet Base (MetaMask, Rainbow Kit, etc.)
- Clave API Pinata Cloud

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/videodanza/nft-platform.git
cd videodanza-nft

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# Iniciar desarrollo
npm run dev
# Visitar http://localhost:3000
```

---

## 📁 Estructura del Proyecto

```
videodanza-nft/
├── docs/
│   ├── ARQUITECTURA.md              # Diagrama técnico completo
│   ├── ALGORITMO_GENERATIVO.md      # Lógica de combinaciones
│   ├── CONTRATOS.md                 # ERC-721 specification
│   ├── API.md                       # Endpoints detallados
│   ├── WIREFRAMES.md                # UI mockups
│   └── FASE0_RESUMEN.md            # Completitud de Fase 0
│
├── smart-contracts/                 # FASE 1
│   ├── contracts/
│   │   └── VideoDanzaNFT.sol        # Contrato ERC-721
│   ├── scripts/
│   │   └── deploy.js                # Deployment script
│   ├── test/
│   │   └── VideoDanzaNFT.test.js    # Test suite
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/                         # FASE 2 (Next.js API)
│   ├── api/
│   │   ├── generate.ts              # POST /api/generate
│   │   ├── composition/
│   │   │   └── [seed].ts            # GET /api/composition/:seed
│   │   ├── ipfs/
│   │   │   ├── upload.ts            # POST /api/ipfs/upload
│   │   │   └── metadata/
│   │   │       └── [cid].ts         # GET /api/ipfs/metadata/:cid
│   │   ├── mint/
│   │   │   └── prepare.ts           # POST /api/mint/prepare
│   │   ├── nfts/
│   │   │   ├── [walletAddress].ts   # GET /api/nfts/:walletAddress
│   │   │   └── [tokenId].ts         # GET /api/nft/:tokenId
│   │   └── health.ts                # GET /api/health
│   │
│   ├── services/
│   │   ├── generativeEngine.ts      # Lógica de generación
│   │   ├── pinataService.ts         # Integración Pinata
│   │   ├── blockchainService.ts     # Queries a blockchain
│   │   └── videoComposer.ts         # Composición de videos
│   │
│   ├── utils/
│   │   ├── seedGenerator.ts         # Hash + seed
│   │   ├── ipfsGateway.ts           # URLs de IPFS
│   │   ├── contractABI.ts           # ABI ERC-721
│   │   └── validators.ts            # Validaciones
│   │
│   └── config/
│       ├── constants.ts             # Constantes
│       └── networks.ts              # Config redes
│
├── frontend/                        # FASE 3 (React)
│   ├── pages/
│   │   ├── _app.tsx                 # Provider global
│   │   ├── index.tsx                # Landing
│   │   ├── app.tsx                  # Selector de preferencias
│   │   ├── watch.tsx                # Video player
│   │   ├── nft-gallery.tsx          # Galería de NFTs
│   │   └── about.tsx                # Información
│   │
│   ├── components/
│   │   ├── PreferenceSelector/
│   │   │   ├── GenderPicker.tsx
│   │   │   ├── PerspectivePicker.tsx
│   │   │   └── MusicTonePicker.tsx
│   │   │
│   │   ├── VideoPlayer/
│   │   │   ├── Player.tsx
│   │   │   ├── VideoLoader.tsx
│   │   │   └── MusicSync.tsx
│   │   │
│   │   ├── MintFlow/
│   │   │   ├── MintButton.tsx
│   │   │   ├── MintModal.tsx
│   │   │   └── SuccessScreen.tsx
│   │   │
│   │   ├── NFTGallery/
│   │   │   ├── GalleryGrid.tsx
│   │   │   ├── NFTCard.tsx
│   │   │   └── DetailModal.tsx
│   │   │
│   │   └── Common/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── LoadingSpinner.tsx
│   │
│   ├── hooks/
│   │   ├── useGenerativeEngine.ts
│   │   ├── useVideoPlayer.ts
│   │   ├── usePinataGateway.ts
│   │   ├── useWeb3Auth.ts
│   │   ├── useNFTMint.ts
│   │   └── useSeeding.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   └── theme.ts
│   │
│   └── public/
│       └── logo.svg
│
└── .env.example                     # Variables de entorno (template)
```

---

## 🔧 Configuración

### Variables de Entorno (.env.local)

```bash
# BLOCKCHAIN
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_RPC_URL=https://mainnet.base.org

# PINATA (IPFS)
PINATA_API_KEY=...
PINATA_API_SECRET=...
PINATA_GATEWAY_URL=https://gateway.pinata.cloud

# BASE TESTNET (Desarrollo)
BASE_TESTNET_RPC=https://sepolia.base.org
BASE_TESTNET_CHAIN_ID=84532

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api
API_SECRET=...

# JWT
JWT_SECRET=...
```

---

## 📚 Documentación

Cada fase tiene documentación completa:

### FASE 0 - Arquitectura ✅
- [ARQUITECTURA.md](docs/ARQUITECTURA.md) - Diagrama técnico
- [ALGORITMO_GENERATIVO.md](docs/ALGORITMO_GENERATIVO.md) - Lógica
- [CONTRATOS.md](docs/CONTRATOS.md) - ERC-721
- [API.md](docs/API.md) - Endpoints
- [WIREFRAMES.md](docs/WIREFRAMES.md) - UI

### FASE 1 - Blockchain & IPFS (Próxima)
- Smart contract deployment
- IPFS asset setup
- Video pinning

### FASE 2 - Backend
- Generative engine
- API implementation
- Database setup

### FASE 3 - Frontend
- React components
- Web3 integration
- UI/UX

### FASE 4 - Interactividad
- Webcam integration
- ML5.js pose detection
- Interactive effects

### FASE 5 - Minting
- Wallet connection
- Mint flow
- NFT gallery

### FASE 6 - Deploy
- Optimization
- Testing
- Vercel deployment

---

## 🎬 Flujo de Uso

```
1. LANDING PAGE
   └─> Usuario aprende sobre el proyecto
   └─> Botón "Explorar Ahora"

2. PREFERENCE SELECTOR
   └─> Elige género (he, she, hybrid, avatar)
   └─> Elige perspectiva (dancer POV, spectator, multiple)
   └─> Elige música (melancholic, joyful, abstract, ambient)
   └─> Clic [GENERATE]

3. VIDEO PLAYER
   └─> Sistema genera composición única (seed)
   └─> Videos se cargan desde IPFS
   └─> Música sincronizada
   └─> Metadata visible
   └─> Clic [MINT NFT]

4. MINT FLOW
   └─> Conectar wallet (Web3)
   └─> Confirmación de transacción (0.001 ETH)
   └─> Blockchain: acuña token ERC-721
   └─> Metadata guardada en IPFS

5. SUCCESS
   └─> NFT acuñado exitosamente
   └─> Links a Etherscan, OpenSea
   └─> Ver en galería personal

6. NFT GALLERY
   └─> Ver todos los NFTs acuñados
   └─> Ver metadata de cada uno
   └─> Compartir en redes
```

---

## 🏗️ Stack Técnico

### Frontend
- **Framework:** Next.js 14 (React 18)
- **Lenguaje:** TypeScript
- **Estilos:** Tailwind CSS + Framer Motion
- **Web3:** Wagmi + Viem
- **Wallet:** RainbowKit
- **Video:** Streaming desde IPFS
- **Audio:** Web Audio API

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Blockchain:** ethers.js + Base RPC
- **IPFS:** Pinata SDK
- **Base de datos:** SQLite (desarrollo) / PostgreSQL (producción)

### Smart Contracts
- **Lenguaje:** Solidity 0.8.20
- **Estándar:** ERC-721 + ERC-2981
- **Librerías:** OpenZeppelin
- **Red:** Base (8453) + Base Sepolia (84532)

### IPFS
- **Servicio:** Pinata Cloud
- **Almacenamiento:** Videos + Música + Metadata
- **Gateway:** CDN de Pinata

---

## 🧪 Testing

```bash
# Smart contracts
cd smart-contracts
npm run test

# Frontend
npm run test

# API integration
npm run test:api
```

---

## 🚀 Deployment

### Base Testnet (Desarrollo)
```bash
npm run deploy:testnet
```

### Base Mainnet (Producción)
```bash
npm run deploy:mainnet
```

### Vercel (Frontend)
```bash
vercel deploy --prod
```

---

## 📊 Estadísticas

- **Combinaciones Únicas:** 20.48 millones
- **Videos en IPFS:** 121 clips
- **Pistas de Música:** 16 (4 tonos × 4 pistas)
- **Costo de Mint:** 0.001 ETH (~$3.50 en Base)
- **Royalties:** 7.5% en ventas secundarias
- **Duración promedio:** 7-8 minutos por composición

---

## 🤝 Contribuir

Este proyecto es generativo y abierto a contribuciones:

1. Agregar más videos de danza
2. Crear nuevas pistas de música
3. Implementar nuevos efectos visuales
4. Mejorar algoritmo generativo
5. Agregar interactividad

Ver [CONTRIBUTING.md](CONTRIBUTING.md) para detalles.

---

## 📜 Licencia

MIT License - Ver [LICENSE](LICENSE)

---

## 📞 Contacto

- **Website:** videodanza.art
- **Twitter:** @videodanzanft
- **Discord:** [Comunidad](https://discord.gg/videodanza)
- **Email:** info@videodanza.art

---

## 🎯 Roadmap

- **Q1 2025:** Fase 0-2 (Arquitectura + Smart Contract + Backend)
- **Q2 2025:** Fase 3-4 (Frontend + Interactividad)
- **Q3 2025:** Fase 5-6 (Minting + Deploy)
- **Q4 2025:** V1.0 en mainnet, marketing, community

---

## 📝 Notas para Desarrolladores

### Principios de Desarrollo

1. **Determinismo:** Mismo seed = misma composición siempre
2. **Reproducibilidad:** Verificable en blockchain
3. **Escalabilidad:** IPFS para descentralización
4. **Seguridad:** Smart contract auditado
5. **UX:** Streaming sin latencia desde IPFS
6. **Monetización:** Royalties automáticos ERC-2981

### Puntos Críticos

⚠️ Los videos en IPFS deben ser accesibles sin CORS issues
⚠️ El algoritmo generativo debe ser determinístico (reproducible)
⚠️ La sincronización video+audio debe ser imperceptible
⚠️ El mint debe ser atómico (todo o nada)
⚠️ Validar seed para evitar duplicados en blockchain

---

## 🎓 Learning Resources

- [ERC-721 Standard](https://eips.ethereum.org/EIPS/eip-721)
- [IPFS Docs](https://docs.ipfs.tech)
- [Base Blockchain](https://docs.base.org)
- [Solidity by Example](https://solidity-by-example.org)
- [Web3.js Docs](https://docs.ethers.org)

---

**Proyecto iniciado:** 24 de Febrero 2025
**Status:** 🟢 FASE 0 Completada
**Siguiente:** FASE 1 - Smart Contracts & IPFS

