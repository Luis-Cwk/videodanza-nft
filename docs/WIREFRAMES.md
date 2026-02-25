# WIREFRAMES Y FLOW DIAGRAMS - VIDEODANZA NFT

## 🎨 User Flow Completo

```
┌─────────────────────────────────────────────────────────────┐
│                    USUARIO LLEGA A APP                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
        ▼                             ▼
    ┌──────────┐              ┌────────────┐
    │Landing   │              │Si ya tiene │
    │Page      │              │wallet,     │
    │Learn +   │              │Skip        │
    │About     │              │to app      │
    └─────┬────┘              └────┬───────┘
          │                        │
          └──────────┬─────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Web3 Connect Wallet Button  │
        │ (Wagmi/RainbowKit)          │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Preference Selector Panel   │
        │ ├─ Gender (radio buttons)   │
        │ ├─ Perspective (radio)      │
        │ └─ Music Tone (radio)       │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ [GENERATE] Button           │
        │ Llamar POST /api/generate   │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Loading Spinner + Info      │
        │ "Generating unique         │
        │  composition..."            │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Video Player               │
        │ ├─ Streaming from IPFS     │
        │ ├─ Music synced            │
        │ ├─ Metadata visible        │
        │ └─ [MINT NFT] Button       │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Mint Modal                 │
        │ ├─ Confirmación            │
        │ ├─ Costo: 0.001 ETH       │
        │ └─ [CONFIRM MINT]          │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Transaction Pending        │
        │ Waiting for confirmation   │
        └────────────┬────────────────┘
                     │
                     ▼
        ┌─────────────────────────────┐
        │ Success Screen             │
        │ ├─ TokenId #2847           │
        │ ├─ Link a Etherscan        │
        │ ├─ Link a OpenSea          │
        │ └─ [VIEW MY NFTS]          │
        └─────────────────────────────┘
```

---

## 📱 Landing Page Wireframe

```
╔═══════════════════════════════════════════════════════════╗
║                   HEADER/NAVBAR                           ║
║  Logo  │                              │  [CONNECT WALLET] ║
╚═══════════════════════════════════════════════════════════╝
                          
┌───────────────────────────────────────────────────────────┐
│                   HERO SECTION                           │
│                                                           │
│           "VIDEODANZA GENERATIVA"                         │
│    Experiencias interactivas únicas con blockchain        │
│                                                           │
│    [EXPLORAR AHORA] [VER GALERÍA]                        │
│                                                           │
│   ┌─────────────────────────────────┐                    │
│   │  Video Hero (animación)         │                    │
│   │                                  │                    │
│   └─────────────────────────────────┘                    │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│           ABOUT SECTION                                  │
│                                                           │
│  ¿Qué es VideoDanza?                                     │
│  [Icon] Cada mint es único e irrepetible                │
│  [Icon] Combinación de video + música + narrativa        │
│  [Icon] Blockchain para autenticidad                     │
│  [Icon] Perspectivas múltiples de danza                 │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│           HOW IT WORKS                                   │
│                                                           │
│  1. Elige tus preferencias    2. Vemos tu composición   │
│  3. Reproducimos             4. Mintea tu NFT           │
│                                                           │
│  [DIAGRAMA VISUAL]                                       │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  FOOTER                                                  │
│  Contact | Docs | GitHub | Twitter                      │
╚═══════════════════════════════════════════════════════════╝
```

---

## 🎬 App Page - Preference Selector

```
╔═══════════════════════════════════════════════════════════╗
║                   HEADER                                 ║
║  Logo  │  VideoDanza Generator      │  [My NFTs]  [...]  ║
╚═══════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────┐
│                                                           │
│              PREFERENCIAS PARA TU EXPERIENCIA             │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  GÉNERO / PERSPECTIVA DEL BAILARÍN                │ │
│  │  ┌──────┐  ┌──────┐  ┌──────────┐  ┌──────────┐ │ │
│  │  │👩     │  │👨     │  │⚪        │  │🤖        │ │ │
│  │  │Ella   │  │Él    │  │Híbrido   │  │Avatar    │ │ │
│  │  └──────┘  └──────┘  └──────────┘  └──────────┘ │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  PERSPECTIVA DE VISUALIZACIÓN                      │ │
│  │  ○ POV del Bailarín  (vista desde los ojos)       │ │
│  │  ● POV del Espectador (vista frontal)             │ │
│  │  ○ Perspectiva Múltiple (cambios dinámicos)       │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │  TONO MUSICAL                                       │ │
│  │  ┌─────────────┐  ┌─────────────┐                 │ │
│  │  │🎵 😢         │  │🎵 😊        │                 │ │
│  │  │Melancólica  │  │Alegre       │                 │ │
│  │  └─────────────┘  └─────────────┘                 │ │
│  │                                                     │ │
│  │  ┌─────────────┐  ┌─────────────┐                 │ │
│  │  │🎵 ✨        │  │🎵 ☁️        │                 │ │
│  │  │Abstracta    │  │Ambiental    │                 │ │
│  │  └─────────────┘  └─────────────┘                 │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│                   [GENERAR COMPOSICIÓN]                   │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  Información: Cada combinación es 100% única y guardada  │
│  en blockchain como NFT. ¡Crea tu propia experiencia!   │
└───────────────────────────────────────────────────────────┘
```

---

## 📹 Video Player Page

```
╔═══════════════════════════════════════════════════════════╗
║                   HEADER                                 ║
║  Logo  │  Now Playing         │  [My NFTs]  [Settings]   ║
╚═══════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────┐
│                                                           │
│                   VIDEO PLAYER                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │                                                     │ │
│  │            [STREAMING VIDEO FROM IPFS]             │ │
│  │                                                     │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ◄◄ [ ▶ ] ►► [████░░░░░] 04:50 / 07:30                 │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ METADATA & COMPOSICIÓN                              │ │
│  │                                                     │ │
│  │ 🎭 Género: Femenino                                │ │
│  │ 👁️ Perspectiva: Múltiple                           │ │
│  │ 🎵 Música: Ambiental (BPM: 60)                     │ │
│  │ ⏱️ Duración total: 7:30                             │ │
│  │ 🎨 Efectos: Glitch, Thermal                        │ │
│  │ 🔗 Seed: 0xa1b2c3d4e5f...                          │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [MINT NFT] [COMPARTIR] [INFORMACIÓN]               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  "Esto es una experiencia única. ¡Mintéalo como NFT!"   │
└───────────────────────────────────────────────────────────┘
```

---

## 💎 Mint Modal

```
                ┌──────────────────────────────────┐
                │   CONFIRMAR MINT DE NFT          │
                │                              [x] │
                └──────────────────────────────────┘
                         │
        ┌────────────────────────────────────┐
        │                                    │
        │  Tu composición será acuñada como │
        │  NFT único en Base blockchain      │
        │                                    │
        │  Detalles:                         │
        │  ├─ Token ID: #2847                │
        │  ├─ Seed: 0xa1b2c3d4e5f6...      │
        │  ├─ Red: Base Mainnet              │
        │  └─ Costo: 0.001 ETH ≈ $3.50      │
        │                                    │
        │  [CONFIRMAR MINT] [CANCELAR]      │
        │                                    │
        └────────────────────────────────────┘
```

---

## ✅ Mint Success Screen

```
┌───────────────────────────────────────────────────────────┐
│                                                           │
│                   ✨ ¡FELICIDADES! ✨                     │
│                                                           │
│         Tu NFT VideoDanza ha sido acuñado                │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Token ID: #2847                                   │ │
│  │  Nombre: VideoDanza #2847                         │ │
│  │  Hash Tx: 0x1234567890...                         │ │
│  │  Wallet: 0x123...abc                              │ │
│  │  Blockchain: Base (8453)                          │ │
│  │  Estado: ✅ Confirmado                             │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                           │
│         [VER EN ETHERSCAN] [VER EN OPENSEA]              │
│                                                           │
│              [CREAR OTRO] [MIS NFTs]                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 🖼️ NFT Gallery Page

```
╔═══════════════════════════════════════════════════════════╗
║                   HEADER                                 ║
║  Logo  │  Mis NFTs       │  [CREAR NUEVO]  [...]        ║
╚═══════════════════════════════════════════════════════════╝

┌───────────────────────────────────────────────────────────┐
│  Mi Colección VideoDanza                                │
│  Total: 5 NFTs acuñados                                 │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ VideoDanza   │  │ VideoDanza   │  │ VideoDanza   │   │
│  │ #2850        │  │ #2849        │  │ #2848        │   │
│  │              │  │              │  │              │   │
│  │ [IMAGE]      │  │ [IMAGE]      │  │ [IMAGE]      │   │
│  │              │  │              │  │              │   │
│  │ 👩 Ella      │  │ 👨 Él        │  │ ⚪ Híbrido   │   │
│  │ 🎵 Alegre    │  │ 🎵 Abstraca  │  │ 🎵 Ambient  │   │
│  │              │  │              │  │              │   │
│  │ [VER] [...]  │  │ [VER] [...]  │  │ [VER] [...]  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ VideoDanza   │  │ VideoDanza   │                     │
│  │ #2847        │  │ #2846        │                     │
│  │              │  │              │                     │
│  │ [IMAGE]      │  │ [IMAGE]      │                     │
│  │              │  │              │                     │
│  │ 👩 Ella      │  │ 🤖 Avatar    │                     │
│  │ 🎵 Melancó   │  │ 🎵 Ambiental │                     │
│  │              │  │              │                     │
│  │ [VER] [...]  │  │ [VER] [...]  │                     │
│  └──────────────┘  └──────────────┘                     │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow Diagram

```
┌────────────┐
│  USUARIO   │
└─────┬──────┘
      │
      │ Selecciona preferencias
      ▼
┌──────────────────────┐
│  FRONTEND SELECTOR   │
└──────────┬───────────┘
           │
           │ POST /api/generate
           ▼
┌──────────────────────────────────────────┐
│         BACKEND GENERATIVE ENGINE        │
│                                          │
│  1. Valida entrada                      │
│  2. Genera SEED (determinístico)        │
│  3. Selecciona videos (seeded random)   │
│  4. Selecciona música                   │
│  5. Crea METADATA JSON                  │
│  6. Sube metadata a IPFS (Pinata)       │
│                                          │
└──────┬──────────────────────────────────┘
       │
       │ Retorna { composition, metadataURI }
       ▼
┌──────────────────────┐
│  FRONTEND PLAYER     │
│                      │
│  1. Carga videos     │
│     desde IPFS       │
│  2. Sincroniza música│
│  3. Renderiza UI     │
│                      │
└──────────┬───────────┘
           │
           │ Usuario hace clic [MINT]
           ▼
┌──────────────────────┐
│  FRONTEND WALLET     │
│                      │
│  1. Conecta Web3     │
│  2. Firma transacción│
│                      │
└──────────┬───────────┘
           │
           │ Transacción
           ▼
┌──────────────────────┐
│   BASE BLOCKCHAIN    │
│                      │
│  VideoDanzaNFT.mint()│
│  - Verifica fondos   │
│  - Acuña token       │
│  - Emite evento      │
│                      │
└──────────┬───────────┘
           │
           │ tokenId + confirmación
           ▼
┌──────────────────────┐
│  FRONTEND SUCCESS    │
│                      │
│  Muestra NFT         │
│  Links a exploradores│
│                      │
└──────────────────────┘
```

---

## 📊 Component Architecture

```
App
├── Pages
│  ├── index.tsx (Landing)
│  ├── app.tsx (Selector)
│  ├── watch.tsx (Player)
│  ├── nft-gallery.tsx (Gallery)
│  └── about.tsx (Info)
│
├── Layout
│  ├── Header (Navigation)
│  └── Footer
│
├── Selectors
│  ├── GenderPicker
│  ├── PerspectivePicker
│  └── MusicTonePicker
│
├── VideoPlayer
│  ├── VideoContainer
│  ├── AudioSync
│  └── MetadataPanel
│
├── MintFlow
│  ├── MintButton
│  ├── MintModal
│  └── SuccessScreen
│
├── NFTGallery
│  ├── GalleryGrid
│  ├── NFTCard
│  └── NFTDetail
│
└── Common
   ├── LoadingSpinner
   ├── ErrorBoundary
   └── ConfirmDialog
```

---

## 🎨 Color Scheme & Theme

```
Primary Colors:
├─ Primary: #6B4C9E (Purple - Creatividad)
├─ Secondary: #00D4FF (Cyan - Tecnología)
├─ Accent: #FF006E (Magenta - Energía)
└─ Dark: #0F0F1E (Muy oscuro para background)

Text Colors:
├─ Primary Text: #FFFFFF
├─ Secondary Text: #B0B0C8
└─ Disabled: #5A5A6F

Backgrounds:
├─ Dark: #0F0F1E
├─ Card: #1A1A2E
├─ Hover: #242442
└─ Success: #00D98E

Accents:
├─ Loading: #00D4FF
├─ Error: #FF006E
└─ Warning: #FFB703
```

---

## 📐 Responsive Breakpoints

```
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
Max Width:  1400px (contenedor central)

Typography:
├─ H1: 48px (desktop) / 32px (mobile)
├─ H2: 36px (desktop) / 24px (mobile)
├─ H3: 24px (desktop) / 18px (mobile)
├─ Body: 16px (desktop) / 14px (mobile)
└─ Caption: 12px (desktop) / 11px (mobile)
```

---

Este documento completa la FASE 0. Tenemos:

✅ **ARQUITECTURA.md** - Diagrama técnico completo del flujo
✅ **ALGORITMO_GENERATIVO.md** - Lógica determinística de combinaciones
✅ **CONTRATOS.md** - Especificación ERC-721 con código Solidity
✅ **API.md** - Endpoints documentados
✅ **WIREFRAMES.md** - UI mockups y flow diagrams

