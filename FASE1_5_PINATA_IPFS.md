# FASE 1.5: Configuración de Pinata IPFS - ✅ COMPLETADA

## Resumen Ejecutivo

**Estado:** ✅ 100% Completada  
**Fecha:** 2026-02-25  
**Chain:** Sepolia Ethereum  
**Contract:** 0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf

---

## 1. Configuración de Pinata

### Credenciales (Guardadas en `.env.local`):
```
PINATA_API_KEY=34d038f10dbd68d94784
PINATA_API_SECRET=8c66237c9bb8eccb0969bba55d4daba679986faca0e256d1da431fc4312073df
PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PINATA_GATEWAY_URL=https://gateway.pinata.cloud
```

### Dashboard Pinata:
- URL: https://pinata.cloud
- Email: pruebasconia@gmail.com
- Status: ✅ Activa

---

## 2. Videos Subidos a IPFS

| # | Nombre | Tamaño | CID | IPFS | Gateway |
|---|--------|--------|-----|------|---------|
| 1 | `20260123_181721-clone_with_audio.mp4` | 431 MB | `bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u` | `ipfs://bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u` | [Link](https://gateway.pinata.cloud/ipfs/bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u) |
| 2 | `20260123_182751-clone_with_audio.mp4` | 215 MB | `bafybeid7uy3g2tc5ijaaltbe65l3xolrd7nh7v5skjksggjf3rfgvflo7e` | `ipfs://bafybeid7uy3g2tc5ijaaltbe65l3xolrd7nh7v5skjksggjf3rfgvflo7e` | [Link](https://gateway.pinata.cloud/ipfs/bafybeid7uy3g2tc5ijaaltbe65l3xolrd7nh7v5skjksggjf3rfgvflo7e) |
| 3 | `20260123_182827-ascii_with_audio.mp4` | 491 MB | `bafybeidcp2i2fnwk7ufdmt7sbwyx7ctvv7mjeqanmy7a2ae6bpktqtppiy` | `ipfs://bafybeidcp2i2fnwk7ufdmt7sbwyx7ctvv7mjeqanmy7a2ae6bpktqtppiy` | [Link](https://gateway.pinata.cloud/ipfs/bafybeidcp2i2fnwk7ufdmt7sbwyx7ctvv7mjeqanmy7a2ae6bpktqtppiy) |
| 4 | `petra9_trails.mp4` | 138 MB | `bafybeidjptx3eovcmt3lm7dyyqxacpkzyp3lwyk7xptvddtzuphmrxmyoq` | `ipfs://bafybeidjptx3eovcmt3lm7dyyqxacpkzyp3lwyk7xptvddtzuphmrxmyoq` | [Link](https://gateway.pinata.cloud/ipfs/bafybeidjptx3eovcmt3lm7dyyqxacpkzyp3lwyk7xptvddtzuphmrxmyoq) |
| 5 | `video_local_horizontal_20260213_122733_procesado_final_hibrido.mp4` | 27 MB | `bafybeia6jjveiwwtsxzobo35cwsmv3afdqxkefkgnmwb4pp4jr43ajxate` | `ipfs://bafybeia6jjveiwwtsxzobo35cwsmv3afdqxkefkgnmwb4pp4jr43ajxate` | [Link](https://gateway.pinata.cloud/ipfs/bafybeia6jjveiwwtsxzobo35cwsmv3afdqxkefkgnmwb4pp4jr43ajxate) |

**Total Subido:** 1.3 GB ✅

---

## 3. Tabla de Lookup IPFS

**Ubicación:** `data/ipfs_lookup_table.json`

Estructura:
```json
{
  "network": "sepolia",
  "chainId": 11155111,
  "contractAddress": "0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf",
  "timestamp": "2026-02-25T05:16:11.767Z",
  "gateway": "https://gateway.pinata.cloud",
  "videos": {
    "20260123_181721-clone_with_audio.mp4": {
      "cid": "bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u",
      "ipfs": "ipfs://bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u",
      "gateway": "https://gateway.pinata.cloud/ipfs/bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u",
      "fileSize": 451922113,
      "uploadTime": "2026-02-25T05:14:19.035Z"
    },
    // ... más videos
  }
}
```

---

## 4. Servicio de Pinata Integrado

### Backend Service (`backend/services/pinataService.js`)

Clase `PinataService` con métodos:

```javascript
// Métodos disponibles:
getVideoCID(videoName)           // Obtiene CID de un video
getVideoUrl(videoName)            // Obtiene URL del gateway
getVideoInfo(videoName)           // Obtiene info completa del video
listVideos()                      // Lista todos los videos
getLookupTable()                  // Obtiene tabla completa
getGatewayUrl(cid)                // Construye URL del gateway
getIpfsUrl(cid)                   // Construye URL ipfs://
loadLookupTable()                 // Carga tabla de lookup
```

**Ejemplo de uso:**
```javascript
const PinataService = require('./backend/services/pinataService');
const pinata = new PinataService();

// Obtener URL de un video
const url = pinata.getVideoUrl('20260123_181721-clone_with_audio.mp4');
console.log(url); // https://gateway.pinata.cloud/ipfs/bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u

// Obtener CID
const cid = pinata.getVideoCID('20260123_181721-clone_with_audio.mp4');
console.log(cid); // bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u

// Listar todos
const videos = pinata.listVideos();
console.log(videos); // ['20260123_181721-clone_with_audio.mp4', ...]
```

### API Endpoints (`backend/api/ipfs.js`)

```
GET  /api/ipfs/videos              - Lista todos los videos
GET  /api/ipfs/video/:videoName    - Info de un video específico
GET  /api/ipfs/cid/:videoName      - Obtiene CID de un video
GET  /api/ipfs/gateway-url/:videoName - URL del gateway
GET  /api/ipfs/lookup-table        - Tabla de lookup completa
```

**Ejemplo:**
```bash
curl http://localhost:3000/api/ipfs/videos
curl http://localhost:3000/api/ipfs/cid/20260123_181721-clone_with_audio.mp4
curl http://localhost:3000/api/ipfs/gateway-url/20260123_181721-clone_with_audio.mp4
```

---

## 5. Scripts Disponibles

### Upload a Pinata:
```bash
npm run upload:pinata
```
Crea/actualiza todos los videos en IPFS y genera tabla de lookup.

### Test Gateway Access:
```bash
npm run test:gateway
```
Verifica que todos los videos sean accesibles.

---

## 6. Integración con Smart Contract

La metadata URI de cada NFT debe apuntar a IPFS:

```javascript
// Ejemplo de mint con metadata IPFS
const metadataURI = "ipfs://bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u";
const tx = await videoDanzaNFT.mint(metadataURI, seed);
```

Metadata JSON en IPFS:
```json
{
  "name": "VideoDanza #1",
  "description": "Generative dance video NFT",
  "image": "ipfs://bafybei...",
  "video": "ipfs://bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u",
  "animation_url": "ipfs://bafybeibisgh7nurllqc6cmu4bnnrbhb4le5qjpend3zkexgo2fcybec73u",
  "attributes": [
    { "trait_type": "Duration", "value": "120 seconds" },
    { "trait_type": "Video_Type", "value": "Clone" }
  ]
}
```

---

## 7. Acceso a Videos

### Vía Pinata Gateway:
```
https://gateway.pinata.cloud/ipfs/{CID}
```

### Vía IPFS Protocol:
```
ipfs://{CID}
```

### Vía API Backend:
```
GET /api/ipfs/gateway-url/20260123_181721-clone_with_audio.mp4
```

---

## 8. Seguridad y Privacidad

✅ **Credenciales seguras:** Guardadas en `.env.local` (NO en git)  
✅ **API Rate Limiting:** Usar backend API en lugar de gateway público  
✅ **Pinata Authentication:** API Key + Secret configurados  
✅ **CORS:** Configurar en backend para evitar acceso directo  

---

## 9. Arquitectura de Flujo

```
Frontend/Usuario
    ↓
Backend API (/api/ipfs/...)
    ↓
PinataService (backend/services/pinataService.js)
    ↓
IPFS Lookup Table (data/ipfs_lookup_table.json)
    ↓
Pinata Gateway (https://gateway.pinata.cloud)
    ↓
IPFS Network
```

---

## 10. Próximos Pasos

### FASE 1.6 - Verificación Final:
- [ ] Crear metadata JSON de ejemplo
- [ ] Subir metadata a IPFS
- [ ] Test de mint completo con metadata IPFS
- [ ] Verificar NFT en Etherscan

### FASE 2 - Frontend (Próximo):
- Crear página de mint
- Integrar Web3 wallet
- Conectar con smart contract
- Mostrar galería de NFTs

---

## Contacto y Support

**Pinata Dashboard:** https://pinata.cloud  
**IPFS Docs:** https://docs.ipfs.io  
**Pinata API Docs:** https://docs.pinata.cloud  

---

**Generado:** 2026-02-25  
**Status:** ✅ COMPLETADO
