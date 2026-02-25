# FASE 1: INFRAESTRUCTURA BLOCKCHAIN & IPFS

## 🎯 Objetivos de la Fase

```
✅ Desarrollar contrato ERC-721 VideoDanzaNFT
✅ Implementar lógica de metadata dinámica  
✅ Subir videos a Pinata Cloud
✅ Documentar hash IPFS de cada video
✅ Crear función de generación de CID único por mint
```

**DELIVERABLE:** Contrato deployado en Base testnet + videos en IPFS

---

## 📋 Tareas de FASE 1

### Tarea 1.1: Setup de Hardhat
**Estado:** ⏳ Pendiente

**Descripción:**
Crear proyecto Hardhat con configuración para Base blockchain

**Pasos:**
1. `cd smart-contracts`
2. `npm init -y`
3. `npm install --save-dev hardhat`
4. `npx hardhat init` (seleccionar TypeScript)
5. Instalar dependencias adicionales

**Deliverable:** `smart-contracts/hardhat.config.js` configurado

---

### Tarea 1.2: Implementar Contrato VideoDanzaNFT.sol
**Estado:** ⏳ Pendiente

**Descripción:**
Implementar código Solidity del contrato ERC-721

**Fuente:** Ver `docs/CONTRATOS.md` para código completo

**Pasos:**
1. Crear `smart-contracts/contracts/VideoDanzaNFT.sol`
2. Copiar código Solidity desde documentación
3. Ajustar imports y configuración
4. Compilar con `npx hardhat compile`
5. Resolver warnings/errors

**Deliverable:** Contrato compilable sin errores

---

### Tarea 1.3: Crear Test Suite
**Estado:** ⏳ Pendiente

**Descripción:**
Implementar tests con Chai y Ethers.js

**Fuente:** Ver `docs/CONTRATOS.md` para test suite

**Tests a incluir:**
- [x] Minting de NFT con seed
- [x] Rechazo de seed duplicado
- [x] Rechazo de pago insuficiente
- [x] Validación de royalties (7.5%)
- [x] Retiro de fondos
- [x] Actualización de precio

**Deliverable:** Tests pasando al 100%

```bash
npm run test
# Output:
# VideoDanzaNFT
#   Minting
#     ✓ Should mint NFT with seed and metadata
#     ✓ Should reject duplicate seed
#     ✓ Should reject insufficient payment
#   Royalties
#     ✓ Should set default royalties to 7.5%
#   Withdraw
#     ✓ Should withdraw funds to owner
```

---

### Tarea 1.4: Deploy a Base Sepolia (Testnet)
**Estado:** ⏳ Pendiente

**Descripción:**
Deployar contrato a red de pruebas Base

**Requisitos previos:**
- Cuenta Alchemy o Infura (RPC)
- Testnet ETH en Base Sepolia (~0.1 ETH)
- Private key guardada en .env.local

**Pasos:**
1. Obtener RPC URL de Alchemy/Infura
2. Obtener testnet ETH de faucet
3. Configurar .env.local con private key
4. Ejecutar `npx hardhat run scripts/deploy.js --network baseSepolia`
5. Guardar dirección del contrato

**Deliverable:** 
- Contrato deployado en Base Sepolia
- Dirección del contrato guardada
- Confirmación en Sepolia BaseScan

**Ejemplo de salida:**
```
Deploying VideoDanzaNFT contract...
Deploying contracts with account: 0x...
VideoDanzaNFT deployed to: 0x1234567890abcdef1234567890abcdef12345678
Deployment addresses saved to deployed-addresses.json
```

---

### Tarea 1.5: Setup Pinata Cloud
**Estado:** ⏳ Pendiente

**Descripción:**
Configurar cuenta Pinata para almacenar assets IPFS

**Pasos:**
1. Ir a https://pinata.cloud
2. Crear cuenta gratuita
3. Generar API Key y API Secret
4. Guardar en .env.local

**Deliverable:**
- Cuenta Pinata activa
- API keys en .env
- Gateway de Pinata verificado

---

### Tarea 1.6: Subir Videos de Prueba
**Estado:** ⏳ Pendiente

**Descripción:**
Crear y subir videos de prueba a IPFS

**Nota:** Para demostración, usaremos videos cortos de prueba

**Estructura de carpetas en Pinata:**
```
videodanza-nft/
├── videos/
│  ├── solos/
│  │  ├── female_01.mp4
│  │  ├── female_02.mp4
│  │  ├── male_01.mp4
│  │  └── ... (20+ videos de prueba)
│  ├── duos/
│  │  ├── dance_pair_01.mp4
│  │  └── ... (5+ videos)
│  ├── group/
│  │  └── ensemble_01.mp4
│  └── transitions/
│     ├── fade.mp4
│     ├── glitch.mp4
│     └── blackout.mp4
│
├── music/
│  ├── melancholic/
│  │  ├── melancholic_01.mp3
│  │  └── melancholic_02.mp3
│  ├── joyful/
│  │  ├── joyful_01.mp3
│  │  └── joyful_02.mp3
│  ├── abstract/
│  │  ├── abstract_01.mp3
│  │  └── abstract_02.mp3
│  └── ambient/
│     ├── ambient_01.mp3
│     └── ambient_02.mp3
```

**Pasos:**
1. Crear archivos de prueba (video + audio cortos)
2. Usar Pinata SDK para subir
3. Documentar IPFS CIDs
4. Crear lookup table

**Deliverable:** 
- 40+ archivos en IPFS
- IPFS_ASSETS.md con lookup table

---

### Tarea 1.7: Crear Lookup Table
**Estado:** ⏳ Pendiente

**Descripción:**
Mapear nombres de videos/música a IPFS CIDs

**Archivo:** `backend/config/ipfsAssets.json`

**Estructura:**
```json
{
  "videos": {
    "solos": {
      "female_01.mp4": "QmXxX1111...",
      "female_02.mp4": "QmXxX2222...",
      "male_01.mp4": "QmXxX3333..."
    },
    "duos": {
      "dance_pair_01.mp4": "QmXxX4444..."
    },
    "group": {
      "ensemble_01.mp4": "QmXxX5555..."
    },
    "transitions": {
      "fade.mp4": "QmXxX6666...",
      "glitch.mp4": "QmXxX7777..."
    }
  },
  "music": {
    "melancholic": {
      "melancholic_01.mp3": "QmYyY1111...",
      "melancholic_02.mp3": "QmYyY2222..."
    },
    "joyful": {
      "joyful_01.mp3": "QmYyY3333...",
      "joyful_02.mp3": "QmYyY4444..."
    }
  }
}
```

**Deliverable:** Archivo JSON funcional con todos los CIDs

---

### Tarea 1.8: Documentar Deployment
**Estado:** ⏳ Pendiente

**Archivo:** `DEPLOYMENT_GUIDE.md`

**Contenido:**
- Dirección del contrato en Base Sepolia
- IPFS gateway URL
- API keys de Pinata
- Instrucciones para verificar en BaseScan
- Verificar video en IPFS

**Deliverable:** Documento completo de deployment

---

## 🔍 Verificación de Completitud - FASE 1

**Cuando FASE 1 esté completa, verifica:**

```
✅ Hardhat project creado
✅ VideoDanzaNFT.sol compilable
✅ Tests pasando al 100%
✅ Contrato deployado en Base Sepolia
✅ Contrato verificable en BaseScan
✅ 40+ videos/audios en IPFS
✅ Lookup table completado
✅ DEPLOYMENT_GUIDE.md documentado
```

**Si algo no funciona → Regresa y soluciona en FASE 1 antes de proceder**

---

## 📚 Referencias para FASE 1

**Smart Contracts:**
- https://docs.hardhat.org
- https://docs.openzeppelin.com/contracts
- https://sepolia.basescan.org (explorer)

**IPFS & Pinata:**
- https://docs.pinata.cloud
- https://docs.ipfs.tech
- https://gateway.pinata.cloud (gateway)

**Testing:**
- https://ethereum-waffle.readthedocs.io
- https://hardhat.org/hardhat-chai-matchers

---

## ⚙️ Configuración Base Sepolia

**Chain ID:** 84532
**RPC:** https://sepolia.base.org
**Explorer:** https://sepolia.basescan.org
**Faucet ETH:** https://www.base.org/guides/news/base-testnet-launch (obtener de faucet)

---

## 📝 Notas Importantes

1. **Private Keys:** Nunca commitear a git. Usar .env.local
2. **Testnet ETH:** Limpio de fondos después de testing
3. **CIDs de IPFS:** Son inmutables. Documentar bien.
4. **Verificación:** Verificar contrato en BaseScan para transparencia
5. **Gas Optimization:** No es crítico en testnet, pero buena práctica

---

**Estado:** 🟡 FASE 1 PREPARADA - LISTO PARA EMPEZAR
**Siguiente Paso:** Comenzar con Tarea 1.1 (Setup de Hardhat)

