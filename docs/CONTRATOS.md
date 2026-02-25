# CONTRATOS INTELIGENTES - VIDEODANZA NFT

## 📋 Especificación ERC-721

### Contrato Principal: `VideoDanzaNFT.sol`

**Localización:** `smart-contracts/contracts/VideoDanzaNFT.sol`

**Red de Deployment:**
- Testnet: Base Sepolia (Chain ID: 84532)
- Mainnet: Base Mainnet (Chain ID: 8453)

**Estándar:** ERC-721 NFT no fungible + ERC-2981 Royalties

---

## 🏛️ Estructura del Contrato

### 1. Herencia y Librerías

```solidity
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract VideoDanzaNFT is ERC721, ERC721URIStorage, ERC2981, Ownable {
  using Counters for Counters.Counter;
  
  // State variables
}
```

**Por qué estas librerías:**
- `ERC721`: Estándar NFT base
- `ERC721URIStorage`: Permite metadata URL por token
- `ERC2981`: Royalties automáticas en ventas secundarias (7.5%)
- `Ownable`: Control de owner para funciones administrativas
- `Counters`: Generador seguro de IDs secuencial

---

## 📊 Variables de Estado

```solidity
contract VideoDanzaNFT is ERC721, ERC721URIStorage, ERC2981, Ownable {
  using Counters for Counters.Counter;
  
  /// @notice Contador de tokens acuñados
  Counters.Counter private _tokenIdCounter;
  
  /// @notice Mapeo de tokenId → seed generativo
  /// @dev Usado para reproducibilidad y verificación
  mapping(uint256 => bytes32) public tokenIdToSeed;
  
  /// @notice Mapeo de seed → tokenId
  /// @dev Evita acuñaciones duplicadas del mismo seed
  mapping(bytes32 => uint256) public seedToTokenId;
  
  /// @notice Precio de mint en Wei (0.001 ETH = 1000000000000000 wei)
  uint256 public mintPrice = 1000000000000000;
  
  /// @notice Royalty percentage (7.5% = 750 basis points)
  uint96 private constant ROYALTY_FEE_NUMERATOR = 750;
  
  /// @notice Eventos emitidos
  event Minted(uint256 indexed tokenId, address indexed to, bytes32 seed);
  event MintPriceUpdated(uint256 newPrice);
  event SeedVerified(uint256 indexed tokenId, bytes32 seed);
}
```

---

## 🎯 Funciones Principales

### 1. **Constructor**

```solidity
/// @notice Inicializa el contrato ERC-721
/// @param initialOwner Dirección del propietario inicial
constructor(address initialOwner) ERC721("VideoDanza", "VDANZA") Ownable(initialOwner) {
  // Configurar royalties: 7.5% en ERC2981
  _setDefaultRoyalty(initialOwner, ROYALTY_FEE_NUMERATOR);
}
```

---

### 2. **mint() - Función Principal**

```solidity
/// @notice Acuña un nuevo NFT VideoDanza con metadata generativa
/// @param metadataURI URI a metadata JSON en IPFS (ipfs://Qm...)
/// @param seed Seed determinístico que generó la composición
/// @return tokenId ID del token acuñado
/// @dev Require: msg.value >= mintPrice
/// @dev Emit: Minted(tokenId, msg.sender, seed)

function mint(string calldata metadataURI, bytes32 seed) 
  external 
  payable 
  returns (uint256) 
{
  // 1. Validar pago
  require(msg.value >= mintPrice, "Insufficient payment");
  
  // 2. Validar seed no duplicado
  require(seedToTokenId[seed] == 0, "Seed already minted");
  
  // 3. Validar metadata URI no vacío
  require(bytes(metadataURI).length > 0, "Metadata URI required");
  
  // 4. Generar tokenId único (autoincremental)
  uint256 tokenId = _tokenIdCounter.current();
  _tokenIdCounter.increment();
  
  // 5. Almacenar seed en mappeo (para reproducibilidad)
  tokenIdToSeed[tokenId] = seed;
  seedToTokenId[seed] = tokenId;
  
  // 6. Acuñar NFT
  _safeMint(msg.sender, tokenId);
  
  // 7. Asignar metadata URI
  _setTokenURI(tokenId, metadataURI);
  
  // 8. Emitir evento (auditable en blockchain)
  emit Minted(tokenId, msg.sender, seed);
  
  return tokenId;
}
```

**Diagrama de flujo:**

```
Usuario llama mint()
    ↓
├─ Validar msg.value >= 0.001 ETH
├─ Validar seed no existe en seedToTokenId
├─ Validar metadataURI no vacío
├─ Generar tokenId secuencial
├─ Almacenar seed → tokenId mapping
├─ _safeMint() (transfiere token a usuario)
├─ _setTokenURI() (liga metadata)
├─ emit Minted() (log en blockchain)
└─ retornar tokenId
```

---

### 3. **getSeed() - Lectura de Seed**

```solidity
/// @notice Obtiene el seed de un token específico
/// @param tokenId ID del token
/// @return seed El seed determinístico utilizado en generación
/// @dev Cualquiera puede llamar (lectura pública)

function getSeed(uint256 tokenId) 
  external 
  view 
  returns (bytes32) 
{
  require(_ownerOf(tokenId) != address(0), "Token does not exist");
  return tokenIdToSeed[tokenId];
}
```

**Uso en frontend:**
```typescript
// Recuperar seed para reproducir composición
const seed = await contract.getSeed(tokenId);
const composition = await api.getCompositionBySeed(seed);
```

---

### 4. **updateMetadata() - Actualizar Metadata**

```solidity
/// @notice Actualiza metadata de un token
/// @param tokenId ID del token a actualizar
/// @param newURI Nueva URI a metadata en IPFS
/// @dev Solo el owner del token puede llamar
/// @dev Permite correcciones sin cambiar seed

function updateMetadata(uint256 tokenId, string calldata newURI) 
  external 
{
  require(ownerOf(tokenId) == msg.sender, "Not token owner");
  require(bytes(newURI).length > 0, "Metadata URI required");
  
  _setTokenURI(tokenId, newURI);
  
  emit MetadataUpdated(tokenId, newURI);
}
```

---

### 5. **withdraw() - Retiro de Fondos**

```solidity
/// @notice Retira fondos acumulados del contrato
/// @dev Solo el owner puede llamar
/// @dev Patrón Pull (seguro contra reentrancy)

function withdraw() 
  external 
  onlyOwner 
{
  uint256 balance = address(this).balance;
  require(balance > 0, "No funds to withdraw");
  
  (bool success, ) = payable(owner()).call{value: balance}("");
  require(success, "Withdrawal failed");
  
  emit Withdrawn(owner(), balance);
}
```

---

### 6. **updateMintPrice() - Ajustar Precio**

```solidity
/// @notice Actualiza el precio de mint
/// @param newPrice Nuevo precio en Wei
/// @dev Solo owner puede llamar
/// @dev Emite evento para auditar cambios

function updateMintPrice(uint256 newPrice) 
  external 
  onlyOwner 
{
  require(newPrice > 0, "Price must be positive");
  mintPrice = newPrice;
  
  emit MintPriceUpdated(newPrice);
}
```

---

## 🔐 Funciones de Soporte Requeridas (OpenZeppelin)

```solidity
// Heredadas de ERC721URIStorage
function tokenURI(uint256 tokenId) 
  public 
  view 
  override(ERC721, ERC721URIStorage) 
  returns (string memory) 
{
  return super.tokenURI(tokenId);
}

// Heredadas de ERC2981
function supportsInterface(bytes4 interfaceId)
  public
  view
  override(ERC721, ERC721URIStorage, ERC2981)
  returns (bool)
{
  return super.supportsInterface(interfaceId);
}

// Heredadas de ERC721URIStorage
function _burn(uint256 tokenId)
  internal
  override(ERC721, ERC721URIStorage)
{
  super._burn(tokenId);
}
```

---

## 📋 Eventos Emitidos

```solidity
// Heredados de ERC721
event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

// Personalizados
event Minted(uint256 indexed tokenId, address indexed to, bytes32 seed);
event MetadataUpdated(uint256 indexed tokenId, string newURI);
event MintPriceUpdated(uint256 newPrice);
event Withdrawn(address indexed to, uint256 amount);
event SeedVerified(uint256 indexed tokenId, bytes32 seed);
```

---

## 💾 Metadata JSON (Almacenado en IPFS)

Cuando se hace mint, el `metadataURI` apunta a un JSON en IPFS:

```json
{
  "name": "VideoDanza #2847",
  "description": "Experiencia generativa única de videodanza interactiva con perspectivas múltiples",
  "image": "ipfs://QmImageThumbnail...",
  "animation_url": "https://videodanza-app.vercel.app/watch?seed=0x...",
  "external_url": "https://videodanza-app.vercel.app",
  
  "attributes": [
    {
      "trait_type": "Gender",
      "value": "feminine"
    },
    {
      "trait_type": "Perspective",
      "value": "multiple_pov"
    },
    {
      "trait_type": "Music Tone",
      "value": "ambient"
    },
    {
      "trait_type": "Duration (seconds)",
      "value": "450"
    },
    {
      "trait_type": "Visual Filters",
      "value": "glitch, thermal"
    },
    {
      "trait_type": "Total Video Clips",
      "value": "7"
    }
  ],
  
  "properties": {
    "seed": "0xa1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6",
    "videoSequence": [
      "ipfs://QmVideo1CID",
      "ipfs://QmTransition1CID",
      "ipfs://QmVideo2CID"
    ],
    "musicTrack": "ipfs://QmMusicCID",
    "createdAt": 1708962000,
    "artist": "VideoDanza Generativa",
    "version": "1.0"
  }
}
```

---

## 🚀 Deployment Script

**Ubicación:** `smart-contracts/scripts/deploy.js`

```javascript
const hre = require("hardhat");

async function main() {
  console.log("Deploying VideoDanzaNFT contract...");
  
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  
  // Desplegar contrato
  const VideoDanzaNFT = await hre.ethers.getContractFactory("VideoDanzaNFT");
  const contract = await VideoDanzaNFT.deploy(deployer.address);
  
  await contract.deployed();
  
  console.log("VideoDanzaNFT deployed to:", contract.address);
  
  // Guardar dirección para uso en frontend
  const fs = require("fs");
  const addresses = {
    videoDanzaNFT: contract.address,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId
  };
  
  fs.writeFileSync(
    "./deployed-addresses.json",
    JSON.stringify(addresses, null, 2)
  );
  
  console.log("Deployment addresses saved to deployed-addresses.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

---

## ✅ Test Suite

**Ubicación:** `smart-contracts/test/VideoDanzaNFT.test.js`

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VideoDanzaNFT", function () {
  let videoDanzaNFT;
  let owner, user1, user2;
  const MINT_PRICE = ethers.utils.parseEther("0.001");
  
  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    
    const VideoDanzaNFT = await ethers.getContractFactory("VideoDanzaNFT");
    videoDanzaNFT = await VideoDanzaNFT.deploy(owner.address);
    await videoDanzaNFT.deployed();
  });
  
  describe("Minting", function () {
    it("Should mint NFT with seed and metadata", async function () {
      const seed = ethers.utils.solidityKeccak256(
        ["string"],
        ["test-seed-123"]
      );
      const metadataURI = "ipfs://QmTestMetadata";
      
      const tx = await videoDanzaNFT.connect(user1).mint(
        metadataURI,
        seed,
        { value: MINT_PRICE }
      );
      
      const receipt = await tx.wait();
      
      // Verificar evento
      expect(receipt.events).to.have.lengthOf(4); // Transfer + Minted + ...
      
      // Verificar seed se almacenó
      const storedSeed = await videoDanzaNFT.getSeed(0);
      expect(storedSeed).to.equal(seed);
    });
    
    it("Should reject duplicate seed", async function () {
      const seed = ethers.utils.solidityKeccak256(
        ["string"],
        ["duplicate-seed"]
      );
      const metadataURI = "ipfs://QmMetadata";
      
      // Primer mint
      await videoDanzaNFT.connect(user1).mint(
        metadataURI,
        seed,
        { value: MINT_PRICE }
      );
      
      // Segundo mint con mismo seed debe fallar
      await expect(
        videoDanzaNFT.connect(user2).mint(
          metadataURI,
          seed,
          { value: MINT_PRICE }
        )
      ).to.be.revertedWith("Seed already minted");
    });
    
    it("Should reject insufficient payment", async function () {
      const seed = ethers.utils.solidityKeccak256(
        ["string"],
        ["test-seed"]
      );
      
      await expect(
        videoDanzaNFT.connect(user1).mint(
          "ipfs://Qm",
          seed,
          { value: ethers.utils.parseEther("0.0001") }
        )
      ).to.be.revertedWith("Insufficient payment");
    });
  });
  
  describe("Royalties", function () {
    it("Should set default royalties to 7.5%", async function () {
      const royaltyInfo = await videoDanzaNFT.royaltyInfo(0, ethers.utils.parseEther("100"));
      expect(royaltyInfo[0]).to.equal(owner.address);
      expect(royaltyInfo[1]).to.equal(ethers.utils.parseEther("7.5"));
    });
  });
  
  describe("Withdraw", function () {
    it("Should withdraw funds to owner", async function () {
      const seed = ethers.utils.solidityKeccak256(["string"], ["seed"]);
      
      // Mint y acumular fondos
      await videoDanzaNFT.connect(user1).mint(
        "ipfs://Qm",
        seed,
        { value: MINT_PRICE }
      );
      
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      
      // Retiro
      const tx = await videoDanzaNFT.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed.mul(receipt.effectiveGasPrice);
      
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      expect(balanceAfter).to.equal(balanceBefore.add(MINT_PRICE).sub(gasCost));
    });
  });
});
```

---

## 📡 Interacción desde Frontend

```typescript
// pages/api/mint.ts (Backend que llama contrato)

import { ethers } from "ethers";
import { VideoDanzaNFTABI } from "@/utils/contractABI";

export async function mintNFT(
  walletAddress: string,
  metadataURI: string,
  seed: string
) {
  // Conectar a Base RPC
  const provider = new ethers.providers.JsonRpcProvider(
    "https://mainnet.base.org"
  );
  
  const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  const contract = new ethers.Contract(
    contractAddress,
    VideoDanzaNFTABI,
    provider
  );
  
  // Preparar transacción
  const mintPrice = await contract.mintPrice();
  
  const tx = await contract.mint(metadataURI, seed, {
    value: mintPrice
  });
  
  // Retornar hash para monitoreo
  return tx.hash;
}
```

---

## 🔍 Verificación en Exploradores

Después de deployment:

```
Base Testnet Explorer:
https://sepolia.basescan.org/address/0x...

Verificar contrato:
- Ver fuente Solidity
- Ver transacciones
- Ver eventos emitidos
- Interactuar con funciones

OpenSea Testnets:
https://testnets.opensea.io/
(Buscar colección VideoDanza)
```

---

## ⚠️ Consideraciones de Seguridad

1. **Reentrancy Protection:** `withdraw()` usa patrón Pull
2. **Integer Overflow:** Solidity 0.8+ tiene checked arithmetic
3. **Unauthorized Access:** Funciones admin usan `onlyOwner`
4. **Seed Uniqueness:** Mapping `seedToTokenId` previene duplicados
5. **Metadata Immutability:** IPFS hash es inmutable

---

## 📚 Referencias

- OpenZeppelin ERC-721: https://docs.openzeppelin.com/contracts/4.x/erc721
- ERC-2981 Royalties: https://eips.ethereum.org/EIPS/eip-2981
- Base Blockchain: https://docs.base.org
- Hardhat Documentation: https://hardhat.org

