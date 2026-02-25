# 🚀 VideoDanza NFT - Quick Reference

## 📍 Dirección del Contrato
```
0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf
```

## 🔗 Links Importantes
- **Etherscan:** https://sepolia.etherscan.io/address/0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf
- **Pinata:** https://pinata.cloud
- **Sepolia Faucet:** https://sepolia.etherscan.io/faucet

## 🎥 Videos en IPFS (CIDs)

| Video | CID |
|-------|-----|
| clone_181721 | bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u |
| clone_182751 | bafybeid7uy3g2tc5ijaaltbe65l3xolrd7nh7v5skjksggjf3rfgvflo7e |
| ascii_182827 | bafybeidcp2i2fnwk7ufdmt7sbwyx7ctvv7mjeqanmy7a2ae6bpktqtppiy |
| trails | bafybeidjptx3eovcmt3lm7dyyqxacpkzyp3lwyk7xptvddtzuphmrxmyoq |
| horizontal | bafybeia6jjveiwwtsxzobo35cwsmv3afdqxkefkgnmwb4pp4jr43ajxate |

## 🛠️ Scripts

```bash
# Test
npm run test              # 29 tests (29/29 passing)

# Compile
npm run compile

# Deploy (si cambias de contrato)
npm run deploy

# IPFS
npm run upload:pinata     # Subir videos a Pinata
npm run test:gateway      # Verificar acceso gateway
```

## 📋 Archivos Clave

```
smart-contracts/
├── contracts/VideoDanzaNFT.sol      ← Smart Contract
├── test/VideoDanzaNFT.test.js       ← Tests (29/29 ✅)
├── deployments/sepolia.json         ← Deployment info
└── hardhat.config.js                ← Config

backend/
├── services/pinataService.js        ← IPFS Service
└── api/ipfs.js                      ← API endpoints

data/
└── ipfs_lookup_table.json           ← Video CIDs

.env.local                           ← Credenciales (NO commit)
```

## 💰 Parámetros Importantes

```
Network:        Sepolia Ethereum (ChainID: 11155111)
Mint Price:     0.001 ETH
Royalties:      7.5% (750 bps)
Owner:          0x1A49138cCb61C50D72A44a299F6C74c690f6c67f
```

## 🔗 API Endpoints (Backend)

```
GET /api/ipfs/videos
GET /api/ipfs/video/:videoName
GET /api/ipfs/cid/:videoName
GET /api/ipfs/gateway-url/:videoName
GET /api/ipfs/lookup-table
```

## 📌 Usar en Frontend

```javascript
// Obtener URL de video
const videoUrl = await fetch('/api/ipfs/gateway-url/20260123_181721-clone_with_audio.mp4')
  .then(r => r.json())
  .then(d => d.url);

// Mintear NFT
const metadataURI = 'ipfs://Qm...';
const seed = ethers.keccak256(ethers.toUtf8Bytes('mi-seed'));
await videoDanzaNFT.mint(metadataURI, seed, { value: MINT_PRICE });
```

## ⚡ Verificaciones Rápidas

```bash
# Ver si el contrato está en blockchain
curl https://sepolia.etherscan.io/api?module=account&action=getsource&address=0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf

# Ver tabla de lookup
cat data/ipfs_lookup_table.json

# Ver configuración
cat .env.local
```

## 📈 Estado Actual

- ✅ Smart Contract: Deployado & Verificado
- ✅ Tests: 29/29 Pasando
- ✅ Videos: 5/5 en IPFS (1.3 GB)
- ✅ Backend: Integrado
- ✅ Documentación: Completa

## 🎯 Próximos Pasos

1. FASE 2: Frontend (React/Next.js)
   - Página de Mint
   - Galería de NFTs
   - Wallet integration

2. FASE 3: Generador interactivo
   - Interfaz de generación
   - Parámetros en tiempo real

3. FASE 4: Funcionalidades avanzadas
   - Webcam input
   - Social sharing
   - Analytics

---

**Última actualización:** 2026-02-25  
**Status:** ✅ Production Ready
