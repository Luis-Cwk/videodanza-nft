# FASE 2: Frontend & Wallet Integration ✅ COMPLETE

## Overview

Built a complete Next.js 14 frontend for the VideoDanza NFT project with:
- **Web3 Integration**: Rainbowkit + Wagmi + Ethers.js
- **Smart Contract Interaction**: Minting NFTs with seed phrases
- **IPFS Integration**: Display and stream videos from Pinata gateway
- **Responsive UI**: Tailwind CSS with dark theme
- **Pages**: Home, Mint, Gallery

---

## Project Structure

```
frontend/
├── app/
│   ├── layout.tsx                    # Root layout with metadata
│   ├── page.tsx                      # Home page
│   ├── providers.tsx                 # Web3 providers setup
│   ├── mint/
│   │   └── page.tsx                  # Mint page
│   └── gallery/
│       └── page.tsx                  # Gallery page
├── components/
│   ├── common/
│   │   ├── Header.tsx                # Navigation header
│   │   └── WalletConnect.tsx         # ConnectButton from RainbowKit
│   ├── mint/
│   │   └── MintCard.tsx              # Mint form component
│   └── gallery/
│       └── Gallery.tsx               # Video gallery component
├── lib/
│   ├── contracts/
│   │   ├── config.ts                 # Contract addresses & chain config
│   │   ├── index.ts                  # Contract exports
│   │   └── VideoDanzaNFT.abi.json    # Contract ABI
│   ├── hooks/
│   │   ├── useContract.ts            # Wagmi hooks for mint/read
│   │   └── useIPFS.ts                # Hooks for IPFS video lookup
│   ├── web3-config.ts                # Wagmi + RainbowKit config
│   └── utils.ts                      # Utility functions (if needed)
├── public/                           # Static assets
├── styles/
│   └── (CSS handled by Tailwind)
├── package.json                      # Dependencies
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind config
├── postcss.config.js                 # PostCSS config
├── tsconfig.json                     # TypeScript config
├── .env.example                      # Environment template
└── .gitignore                        # Git ignore rules
```

---

## Key Components

### 1. **Mint Card** (`components/mint/MintCard.tsx`)
- Seed phrase input
- Deterministic seed generation using ethers.keccak256
- Video selection dropdown
- Real-time minting status
- Mint price display
- Error/success messages
- Transaction feedback

**Features**:
- Checks if seed is already minted
- Auto-generates keccak256 hash from seed phrase
- Validates wallet connection
- Handles transaction confirmation

### 2. **Gallery** (`components/gallery/Gallery.tsx`)
- Displays all available videos
- Video preview grid (3 columns on desktop)
- Selected video player in modal
- IPFS CID and gateway URLs displayed
- Responsive design

### 3. **Web3 Setup**
- **Providers** (`app/providers.tsx`):
  - QueryClientProvider (Tanstack Query)
  - WagmiProvider (with Sepolia config)
  - RainbowKitProvider (wallet UI)
  
- **Configuration** (`lib/web3-config.ts`):
  - Sepolia Ethereum chain setup
  - Wallet connectors (MetaMask, WalletConnect, etc.)

- **Hooks** (`lib/hooks/useContract.ts`):
  - `useNFTContract()`: Contract config
  - `useMintPrice()`: Read mint price
  - `useIsSeedMinted()`: Check if seed already minted
  - `useMintNFT()`: Execute mint transaction
  - `useTokenMetadata()`: Read token metadata

### 4. **IPFS Hooks** (`lib/hooks/useIPFS.ts`)
- `useIPFSLookupTable()`: Fetch all video CID mappings
- `useIPFSVideo()`: Get CID and URL for specific video
- `getIPFSUrl()`: Generate Pinata gateway URL

---

## Environment Configuration

Create `frontend/.env.local`:

```bash
# Wallet Connect (get from https://cloud.walletconnect.com/)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=YOUR_PROJECT_ID

# API Base URL (backend service for IPFS lookups)
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Smart Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf
NEXT_PUBLIC_CHAIN_ID=11155111

# IPFS Gateway
NEXT_PUBLIC_IPFS_GATEWAY=https://gateway.pinata.cloud/ipfs
```

---

## Dependencies

### Core Web3
- `wagmi` (^2.11.0) - Ethereum React hooks
- `viem` (^2.13.0) - Ethereum utilities
- `@rainbow-me/rainbowkit` (^2.1.0) - Wallet connection UI
- `ethers` (^6.9.0) - Additional Ethereum utilities

### UI & Forms
- `react-hook-form` (^7.48.0) - Form handling
- `tailwindcss` (^3.3.0) - Styling
- `clsx` (^2.0.0) - Conditional CSS classes

### HTTP & Data
- `axios` (^1.6.0) - HTTP requests
- `@tanstack/react-query` (^5.35.0) - Query management

### Build Tools
- `next` (^14.0.0) - React framework
- `typescript` (^5.3.0) - Type safety
- `eslint-config-next` (^14.0.0) - Linting

---

## Running the Frontend

### Development
```bash
cd frontend
npm run dev
```
Server runs on `http://localhost:3000`

### Build
```bash
npm run build
```

### Production
```bash
npm run start
```

### Type Check
```bash
npm run type-check
```

---

## Pages

### Home Page (`/`)
- Project overview
- Feature highlights
- How-it-works guide
- Tech stack information
- CTA buttons to Mint & Gallery

### Mint Page (`/mint`)
- `MintCard` component
- Seed phrase input
- Video selection
- Mint button with transaction feedback
- Feature explanation cards

### Gallery Page (`/gallery`)
- `Gallery` component
- Video grid
- Video preview modal
- IPFS URL display

---

## Smart Contract Integration

### Mint Function Flow
1. User enters seed phrase
2. Frontend generates keccak256 hash
3. Checks if seed already minted via `_seedMinted()` mapping
4. User selects video
5. On submit:
   - Validates all inputs
   - Calls contract `mint(seed)` with 0.001 ETH
   - Monitors transaction
   - Displays success message

### Read-Only Functions
- `mintPrice()`: Get current mint price (0.001 ETH)
- `_seedMinted(seed)`: Check if seed was already minted
- `tokenURI(tokenId)`: Get token metadata

---

## IPFS Integration

### Video Lookup Flow
1. On page load, fetch IPFS lookup table from backend API
2. For selected video, get CID from mapping
3. Generate Pinata gateway URL: `https://gateway.pinata.cloud/ipfs/{CID}`
4. Stream video via HTML5 `<video>` element

### Backend API Endpoints Used
- `GET /api/ipfs/lookup-table` - Get all video mappings
- `GET /api/ipfs/cid/:videoName` - Get specific video CID
- `GET /api/ipfs/videos` - List all videos

---

## Styling & Theme

**Color Scheme**:
- Background: `slate-950` (dark)
- Primary Accent: `purple` (#a855f7)
- Secondary Accent: `pink` (#ec4899)

**Components**:
- Gradient backgrounds
- Border animations
- Hover states
- Responsive grid layouts
- Modal dialogs
- Form inputs with validation states

---

## Build Status

✅ **Compilation**: Successful  
✅ **TypeScript**: Strict mode enabled  
✅ **Bundle Size**: Optimized with Next.js  
✅ **Dependencies**: 920 packages installed  

---

## Next Steps (FASE 3)

1. **Deploy to Vercel** (this FASE)
2. **API Connection** (backend services)
3. **Advanced Features**:
   - User NFT portfolio
   - Transaction history
   - Metadata customization
   - Webcam integration for video generation
   - Social sharing

---

## Deployment

### Vercel (Recommended)
```bash
# From project root
npm run deploy:frontend
```

Or manually:
1. Push code to GitHub
2. Go to https://vercel.com
3. Import from GitHub: `videodanza-nft`
4. Set environment variables from `.env.local`
5. Deploy!

### Environment Variables on Vercel
- `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CONTRACT_ADDRESS`
- `NEXT_PUBLIC_CHAIN_ID`
- `NEXT_PUBLIC_IPFS_GATEWAY`

---

## Known Issues & Warnings

### Build Warnings (Harmless)
- `@metamask/sdk` missing `@react-native-async-storage/async-storage` (browser-only bundle)
- `pino` missing `pino-pretty` (optional logging)
- These don't affect functionality

### Testing
- Pages require Web3 provider context
- Minting requires connected wallet on Sepolia testnet
- IPFS gateway may rate-limit on high traffic

---

## File Size & Performance

- Next.js build: ~4.2 MB (optimized)
- CSS: ~150 KB (Tailwind)
- JS (client): ~1.8 MB (including Web3 libs)
- Core app code: ~200 KB

---

## Tech Stack Summary

```
Frontend Stack:
├── Framework: Next.js 14 (App Router)
├── Language: TypeScript
├── Styling: Tailwind CSS + PostCSS
├── Web3: Wagmi v2 + Viem v2 + Ethers v6
├── Wallet: RainbowKit v2
├── Forms: React Hook Form
├── HTTP: Axios
├── Query: Tanstack Query (via Wagmi)
└── Build: webpack/esbuild (via Next.js)
```

---

**Status**: ✅ FASE 2 COMPLETE - Ready for FASE 3  
**Last Updated**: 2026-02-25  
**Next Phase**: Deploy to Vercel + Backend API Integration
