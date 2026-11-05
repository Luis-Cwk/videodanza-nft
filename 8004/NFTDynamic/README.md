# NFT Dinámico - Guía de Despliegue en Sepolia

## Características del Contrato

- **4 Estados evolutivos**: Egg → Hatchling → Adult → Elder
- **Evolución temporal**: Cada 2 minutos (configurable)
- **Transferencias bloqueadas**: No se puede transferir en estado Egg
- **Metadata dinámica**: Cambia automáticamente con cada evolución
- **Semilla aleatoria**: Cada NFT tiene atributos únicos generados al mintear

## Opción 1: Despliegue con Remix (Recomendado para principiantes)

### Paso 1: Preparar tu wallet

1. Instala MetaMask en tu navegador
2. Cambia la red a "Sepolia Test Network"
3. Obtén ETH de prueba gratis en:
   - https://sepoliafaucet.com/ (0.5 ETH/día)
   - https://www.alchemy.com/faucets/ethereum-sepolia
   - https://faucet.quicknode.com/ethereum/sepolia

### Paso 2: Abrir Remix

1. Ve a https://remix.ethereum.org/
2. Crea un nuevo archivo: `NFTDynamic.sol`
3. Copia y pega el código del contrato

### Paso 3: Compilar

1. Ve a la pestaña "Solidity Compiler" (icono 🟦)
2. Selecciona versión del compilador: `0.8.19` o superior
3. Click en "Compile NFTDynamic.sol"
4. Verifica que no hay errores ✅

### Paso 4: Desplegar

1. Ve a la pestaña "Deploy & Run Transactions" (icono ➡️)
2. En "ENVIRONMENT", selecciona "Injected Provider - MetaMask"
3. Conecta tu wallet cuando MetaMask lo solicite
4. En "CONTRACT", selecciona `NFTDynamic`
5. Completa los parámetros del constructor:
   - **name**: `"EvolvingNFT"` (o cualquier nombre)
   - **symbol**: `"ENFT"` (o cualquier símbolo)
   - **baseURI**: `"https://tu-metadata-url.com/"` (o deja `""` para usar metadata inline)
6. Click en "Deploy"
7. Confirma la transacción en MetaMask

### Paso 5: Interactuar con tu NFT

Una vez desplegado, verás los botones para interactuar:

#### Funciones del Propietario (Owner):
- **mint(to)**: Crea un nuevo NFT. Ejemplo: `0xTuDireccion`
- **mintBatch(to, quantity)**: Crea múltiples NFTs. Ejemplo: `0xTuDireccion`, `5`
- **setBaseURI(baseURI)**: Cambia la URL base de metadata
- **withdraw()**: Retira ETH del contrato

#### Funciones para Todos:
- **evolve(tokenId)**: Evoluciona un NFT (solo si pasaron 2 minutos)
- **checkAndEvolve(tokenId)**: Verifica y evoluciona automáticamente
- **getState(tokenId)**: Obtiene el estado actual
- **getTimeUntilNextEvolution(tokenId)**: Tiempo restante para evolucionar
- **getNFTData(tokenId)**: Obtiene todos los datos del NFT
- **ownerOf(tokenId)**: Dirección del dueño
- **tokenURI(tokenId)**: Metadata completa del NFT

### Paso 6: Verificar en OpenSea

1. Ve a https://testnets.opensea.io/
2. Conecta tu wallet
3. Busca tu contrato por dirección
4. Verás tus NFTs con sus estados evolutivos

---

## Opción 2: Despliegue con Foundry (Avanzado)

### Instalación de Foundry

```bash
# Windows (usando PowerShell como Administrador)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# O usando cargo
cargo install --git https://github.com/foundry-rs/foundry --profile local forge cast chisel anvil
```

### Configuración del Proyecto

```bash
# Clonar o crear el proyecto
mkdir NFTDynamic && cd NFTDynamic
forge init --force

# Instalar OpenZeppelin
forge install OpenZeppelin/openzeppelin-contracts@v5.0.0 --no-commit
```

### Configurar Variables de Entorno

Crea un archivo `.env`:

```env
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_API_KEY
PRIVATE_KEY=0xTU_CLAVE_PRIVADA_SIN_0x
ETHERSCAN_API_KEY=TU_API_KEY_DE_ETHERSCAN
```

Carga las variables:
```bash
source .env
```

### Compilar

```bash
forge build
```

### Desplegar

```bash
forge script script/Deploy.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast --verify -vvvv
```

### Verificar Contrato

```bash
forge verify-contract --chain-id 11155111 --watch --constructor-args $(cast abi-encode "constructor(string,string,string)" "EvolvingNFT" "ENFT" "") TU_DIRECCION_DEL_CONTRATO NFTDynamic
```

---

## Ejemplo de Uso

```solidity
// 1. Mintear un NFT
nft.mint(0xTuDireccion)
// Devuelve: tokenId = 1

// 2. Ver estado inicial
nft.getState(1) 
// Devuelve: 0 (Egg)

// 3. Esperar 2 minutos...

// 4. Evolucionar
nft.evolve(1)

// 5. Ver nuevo estado
nft.getState(1)
// Devuelve: 1 (Hatchling)

// 6. Ahora puedes transferirlo!
nft.transferFrom(0xTuDireccion, 0xOtraDireccion, 1)
```

---

## Configuración de Metadata Personalizada

Para usar tu propia metadata:

1. Sube imágenes a IPFS (usa Pinata: https://pinata.cloud/)
2. Crea archivos JSON para cada estado:
   ```json
   {
     "name": "Evolving NFT #1 - Egg",
     "description": "A mysterious egg...",
     "image": "ipfs://TU_CID/egg.png",
     "attributes": [
       {"trait_type": "State", "value": "Egg"},
       {"trait_type": "Stage", "value": "1/4"}
     ]
   }
   ```
3. En el constructor, usa: `"ipfs://TU_CID/"`
4. Modifica `_generateURI()` para apuntar a tu estructura

---

## Costos Estimados (Sepolia)

- Despliegue: ~0.001-0.003 ETH
- Mint: ~0.0001-0.0003 ETH por NFT
- Evolve: ~0.00005-0.0001 ETH

## Redes Soportadas

- ✅ Ethereum Sepolia (Testnet)
- ✅ Ethereum Mainnet
- ✅ Polygon
- ✅ Arbitrum
- ✅ Optimism
- ✅ Base

## Recursos Adicionales

- **Remix IDE**: https://remix.ethereum.org/
- **Sepolia Faucet**: https://sepoliafaucet.com/
- **OpenSea Testnet**: https://testnets.opensea.io/
- **Etherscan Sepolia**: https://sepolia.etherscan.io/
- **Pinata IPFS**: https://pinata.cloud/

## Soporte

Si tienes problemas:
1. Verifica que tienes suficiente ETH de prueba
2. Comprueba que usaste la red Sepolia
3. Revisa los logs de errores en Remix
4. Verifica que el compilador sea 0.8.19 o superior

¡Tu NFT evolutivo está listo! 🚀
