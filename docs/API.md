# API BACKEND - VIDEODANZA NFT

## 🌐 Base de la API

**URL Base (Producción):** `https://videodanza-app.vercel.app/api`
**URL Base (Desarrollo):** `http://localhost:3000/api`

**Framework:** Next.js 14 App Router
**Autenticación:** Web3 (wallet signature) + JWT opcional

---

## 📋 Endpoints

### 1. **POST /api/generate**

**Descripción:** Genera una composición única de videodanza

**Parámetros de Entrada:**
```typescript
interface GenerateRequest {
  walletAddress: string; // "0x123...abc"
  preferences: {
    gender: 'female' | 'male' | 'hybrid';
    perspective: 'dancer_pov' | 'spectator_pov' | 'multiple_pov';
    musicTone: 'melancholic' | 'joyful' | 'abstract' | 'ambient';
  };
  timestamp?: number; // Unix timestamp (opcional, default: Date.now())
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "composition": {
    "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "gender": "feminine",
    "perspective": "multiple_pov",
    "musicTone": "ambient",
    "videoSequence": [
      "QmVideo1Hash...",
      "QmTransitionHash...",
      "QmVideo2Hash...",
      "QmVideo3Hash..."
    ],
    "musicTrack": {
      "cid": "QmMusicHash...",
      "name": "ambient_01.mp3",
      "bpm": 60,
      "mood": "atmospheric"
    },
    "visualFilters": ["glitch", "thermal"],
    "totalDuration": 450,
    "metadata": {
      "createdAt": 1708962000,
      "version": "1.0"
    }
  },
  "metadataURI": "ipfs://QmMetadataHash...",
  "message": "Composition generated successfully"
}
```

**Errores Posibles:**
```json
{
  "error": "Invalid gender parameter",
  "code": "INVALID_PARAMS",
  "statusCode": 400
}
```

**Flujo Interno:**
```typescript
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validar entrada
    validateGenerateRequest(body);
    
    // Generar composición
    const composition = await generativeEngine.generate(
      body.walletAddress,
      body.preferences,
      body.timestamp || Date.now()
    );
    
    // Crear metadata JSON
    const metadata = createMetadata(composition);
    
    // Subir metadata a IPFS (Pinata)
    const metadataURI = await pinataService.uploadJSON(metadata);
    
    // Retornar resultado
    return Response.json({
      success: true,
      composition,
      metadataURI
    });
  } catch (error) {
    return Response.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

---

### 2. **GET /api/composition/:seed**

**Descripción:** Recupera una composición existente por seed

**Parámetros URL:**
- `seed` (string): Seed en formato hexadecimal "0x..."

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "composition": {
    "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "gender": "feminine",
    "perspective": "multiple_pov",
    "musicTone": "ambient",
    "videoSequence": ["QmVideo1...", "QmVideo2..."],
    "musicTrack": {
      "cid": "QmMusic...",
      "name": "ambient_01.mp3",
      "bpm": 60
    },
    "visualFilters": ["glitch"],
    "totalDuration": 450
  }
}
```

**Error - Seed no encontrado (404):**
```json
{
  "error": "Seed not found",
  "code": "SEED_NOT_FOUND",
  "statusCode": 404
}
```

**Nota:** Este endpoint permite reproducir una composición ya generada. Es determinístico, siempre retorna lo mismo para un seed dado.

---

### 3. **POST /api/ipfs/upload**

**Descripción:** Sube contenido a IPFS (Pinata)

**Parámetros de Entrada:**
```typescript
interface IPFSUploadRequest {
  content: {
    type: 'json' | 'file';
    data: Record<string, any> | Buffer;
  };
  metadata?: {
    name?: string;
    description?: string;
  };
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "ipfs": {
    "hash": "QmXxX1234567890...",
    "url": "https://gateway.pinata.cloud/ipfs/QmXxX1234567890...",
    "gatewayUrl": "https://ipfs.io/ipfs/QmXxX1234567890..."
  },
  "pinned": true,
  "timestamp": 1708962000
}
```

---

### 4. **GET /api/ipfs/metadata/:cid**

**Descripción:** Obtiene metadata JSON desde IPFS

**Parámetros URL:**
- `cid` (string): Content ID de IPFS "QmXxX..."

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "metadata": {
    "name": "VideoDanza #2847",
    "description": "Experiencia generativa única...",
    "image": "ipfs://QmImage...",
    "animation_url": "https://videodanza-app.vercel.app/watch?seed=0x...",
    "attributes": [...],
    "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "videoSequence": [...],
    "musicTrack": "ipfs://QmMusic..."
  },
  "source": "ipfs"
}
```

---

### 5. **POST /api/mint/prepare**

**Descripción:** Prepara datos para mint en blockchain

**Parámetros de Entrada:**
```typescript
interface MintPrepareRequest {
  walletAddress: string;
  compositionSeed: string; // "0x..."
  metadataURI: string;     // "ipfs://QmXxX..."
}
```

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "mint": {
    "to": "0x123...abc",
    "metadataURI": "ipfs://QmMetadata...",
    "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "estimatedGas": "85000",
    "mintPrice": "1000000000000000",
    "contractAddress": "0xVideoDanzaAddress...",
    "chainId": 8453,
    "network": "base-mainnet"
  },
  "ready": true
}
```

**Flujo para Frontend:**
```typescript
// Frontend usa esta respuesta para llamar contract.mint()
const response = await fetch('/api/mint/prepare', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: userAddress,
    compositionSeed: seed,
    metadataURI: metadataURI
  })
});

const { mint } = await response.json();

// Pasar a wagmi/ethers para ejecutar transacción
await writeContract({
  address: mint.contractAddress,
  abi: VideoDanzaNFTABI,
  functionName: 'mint',
  args: [mint.metadataURI, mint.seed],
  value: BigInt(mint.mintPrice)
});
```

---

### 6. **GET /api/nfts/:walletAddress**

**Descripción:** Lista NFTs acuñados por un usuario

**Parámetros URL:**
- `walletAddress` (string): Dirección wallet "0x..."

**Query Parameters:**
- `limit` (number): Máximo de NFTs a retornar (default: 50)
- `offset` (number): Página (default: 0)

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "user": "0x123...abc",
  "nfts": [
    {
      "tokenId": 2847,
      "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
      "metadataURI": "ipfs://QmMetadata...",
      "metadata": {
        "name": "VideoDanza #2847",
        "description": "...",
        "attributes": [
          { "trait_type": "Gender", "value": "feminine" },
          { "trait_type": "Music Tone", "value": "ambient" }
        ]
      },
      "mintedAt": 1708962000,
      "transactionHash": "0xTxHash...",
      "blockNumber": 15482947
    },
    {
      "tokenId": 2846,
      ...
    }
  ],
  "total": 2,
  "pagination": {
    "limit": 50,
    "offset": 0,
    "totalPages": 1
  }
}
```

**Flujo Interno:**
```typescript
// Query blockchain vía RPC provider
const contract = new ethers.Contract(
  contractAddress,
  VideoDanzaNFTABI,
  provider
);

const tokenIds = [];
for (let i = 0; i < totalSupply; i++) {
  try {
    const owner = await contract.ownerOf(i);
    if (owner.toLowerCase() === walletAddress.toLowerCase()) {
      tokenIds.push(i);
    }
  } catch (error) {
    // Token quemado o no existe
  }
}

// Recuperar metadata de cada token
const nfts = await Promise.all(
  tokenIds.map(async (tokenId) => {
    const uri = await contract.tokenURI(tokenId);
    const seed = await contract.getSeed(tokenId);
    const metadata = await fetch(uri).then(r => r.json());
    return { tokenId, seed, metadataURI: uri, metadata };
  })
);
```

---

### 7. **GET /api/nft/:tokenId**

**Descripción:** Obtiene detalles de un NFT específico

**Parámetros URL:**
- `tokenId` (number): ID del token

**Respuesta Exitosa (200):**
```json
{
  "success": true,
  "nft": {
    "tokenId": 2847,
    "owner": "0x123...abc",
    "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "metadataURI": "ipfs://QmMetadata...",
    "metadata": {
      "name": "VideoDanza #2847",
      "image": "ipfs://QmImage...",
      "animation_url": "https://videodanza-app.vercel.app/watch?seed=0x...",
      "attributes": [...]
    },
    "blockchainData": {
      "mintedAt": 1708962000,
      "transactionHash": "0xTxHash...",
      "blockNumber": 15482947,
      "gasUsed": "95000",
      "gasPrice": "1000000000"
    },
    "composition": {
      "videoSequence": ["ipfs://QmVideo1...", "ipfs://QmVideo2..."],
      "musicTrack": "ipfs://QmMusic...",
      "totalDuration": 450,
      "visualFilters": ["glitch", "thermal"]
    }
  }
}
```

---

### 8. **GET /api/health**

**Descripción:** Health check del API

**Respuesta Exitosa (200):**
```json
{
  "status": "healthy",
  "timestamp": 1708962000,
  "services": {
    "database": "connected",
    "ipfs": "connected",
    "blockchain": "connected",
    "generativeEngine": "ready"
  },
  "version": "1.0.0",
  "uptime": 3600000
}
```

---

## 🔐 Autenticación

### Web3 Signature Authentication

Para operaciones que requieren autenticación (mint, etc):

```typescript
// Frontend
const message = "Sign to authenticate: " + Date.now();
const signature = await signer.signMessage(message);

// Enviar con solicitud
const response = await fetch('/api/mint/prepare', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${signature}`,
    'X-Address': walletAddress,
    'X-Timestamp': Date.now()
  },
  body: JSON.stringify({ ... })
});

// Backend
import { verifyMessage } from 'ethers/lib/utils';

export async function verifyWeb3Signature(
  signature: string,
  address: string,
  timestamp: number
) {
  const message = "Sign to authenticate: " + timestamp;
  const recovered = verifyMessage(message, signature);
  return recovered.toLowerCase() === address.toLowerCase();
}
```

---

## 🚨 Códigos de Error

| Código | Descripción | HTTP Status |
|--------|-------------|-------------|
| `INVALID_PARAMS` | Parámetros de entrada inválidos | 400 |
| `MISSING_REQUIRED` | Campo requerido faltante | 400 |
| `INVALID_SEED` | Formato de seed inválido | 400 |
| `SEED_NOT_FOUND` | Seed no encontrado en base de datos | 404 |
| `IPFS_UPLOAD_FAILED` | Error subiendo a IPFS | 500 |
| `BLOCKCHAIN_ERROR` | Error interactuando con blockchain | 500 |
| `RATE_LIMIT_EXCEEDED` | Demasiadas solicitudes | 429 |
| `UNAUTHORIZED` | Firma Web3 inválida | 401 |
| `SERVER_ERROR` | Error interno del servidor | 500 |

---

## 📊 Rate Limiting

- **General:** 100 requests/minuto por IP
- **POST /api/generate:** 20 requests/minuto por wallet
- **POST /api/mint/prepare:** 5 requests/minuto por wallet

Headers de respuesta:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1708962060
```

---

## 📝 Ejemplos de Uso

### Flujo Completo: Generar y Mintear

```typescript
// 1. Generar composición
const generateRes = await fetch('/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: '0x123...abc',
    preferences: {
      gender: 'female',
      perspective: 'multiple_pov',
      musicTone: 'ambient'
    }
  })
});

const { composition, metadataURI } = await generateRes.json();

// 2. Preparar mint
const mintPrepareRes = await fetch('/api/mint/prepare', {
  method: 'POST',
  body: JSON.stringify({
    walletAddress: '0x123...abc',
    compositionSeed: composition.seed,
    metadataURI: metadataURI
  })
});

const { mint } = await mintPrepareRes.json();

// 3. Ejecutar mint en blockchain (wagmi)
const { hash } = await writeContract({
  address: mint.contractAddress,
  abi: VideoDanzaNFTABI,
  functionName: 'mint',
  args: [mint.metadataURI, mint.seed],
  value: BigInt(mint.mintPrice)
});

// 4. Esperar confirmación
await waitForTransaction({ hash });

// 5. Recuperar NFT
const nftRes = await fetch(`/api/nfts/${userAddress}`);
const { nfts } = await nftRes.json();
```

---

## 🔄 Webhook Events (Futuro)

Para implementar en Fase 4+:

```
POST /webhook/nft-minted
POST /webhook/ipfs-pinned
POST /webhook/blockchain-confirmed
```

---

## 📚 Documentación Adicional

- Pinata API: https://docs.pinata.cloud/api-reference
- ethers.js: https://docs.ethers.org
- Next.js API Routes: https://nextjs.org/docs/api-routes/introduction

