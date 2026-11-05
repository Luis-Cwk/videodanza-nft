# EntropiaNFT - NFT Evolutivo con Arte Generativo

NFT que representa la identidad del agente **entropiav2**, con arte generativo SVG que evoluciona con el tiempo.

## Estados de Evolucion

| Estado | Descripcion | Tiempo |
|--------|-------------|--------|
| **Semilla** | Estado inicial, energia concentrada | 0 min |
| **Germinacion** | Primera expansion, formas geometricas | +2 min |
| **Florecimiento** | Pleno desarrollo, redes neurales | +2 min |
| **Transcendencia** | Estado final, maxima complejidad | +2 min |

## Arte Generativo

Cada NFT genera un SVG unico con:
- **Particulas**: Puntos luminosos que parpadean
- **Forma central**: Evoluciona de circulo a poligono complejo
- **Red neuronal**: Conexiones que aparecen en estados avanzados
- **Lineas de entropia**: Ondas en el estado final
- **Colores**: Violeta (Semilla) -> Cyan -> Verde -> Dorado (Transcendencia)

## Despliegue en Sepolia

### Opcion 1: Remix (Recomendado)

1. Ve a https://remix.ethereum.org/
2. Crea archivo `EntropiaNFT.sol` y pega el codigo
3. Compila con Solidity 0.8.19+
4. Despliega en Sepolia con parametros:
   - name: `"entropiav2"`
   - symbol: `"ENTRO"`

### Opcion 2: Foundry

```bash
cd NFTDynamic

# Configurar .env
echo "SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/TU_API_KEY" > .env
echo "PRIVATE_KEY=tu_clave_privada" >> .env

# Compilar
forge build

# Desplegar
forge script script/DeployEntropia.s.sol --rpc-url $SEPOLIA_RPC_URL --broadcast -vvvv
```

## Interactuar con el NFT

```solidity
// Mintear
nft.mint(tu_direccion)

// Ver estado
nft.getState(1) // 0 = Semilla, 1 = Germinacion, etc.

// Ver tiempo hasta proxima evolucion
nft.getTimeUntilNextEvolution(1)

// Evolucionar (despues de 2 minutos)
nft.evolve(1)

// Obtener metadata (SVG visible en wallets)
nft.tokenURI(1)
```

## Ver en OpenSea

1. Ve a https://testnets.opensea.io/
2. Conecta tu wallet
3. Busca por direccion del contrato
4. El NFT mostrara el SVG generativo con animaciones

## Ejemplo de Metadata

```json
{
  "name": "entropiav2 #1 - Semilla",
  "description": "Agente creativo blockchain x IA...",
  "image": "data:image/svg+xml;base64,...",
  "attributes": [
    {"trait_type": "Estado", "value": "Semilla"},
    {"trait_type": "Evolucion", "value": 1, "max_value": 4},
    {"trait_type": "Agente", "value": "entropiav2"},
    {"trait_type": "Blockchain", "value": "Ethereum Sepolia"}
  ]
}
```

## Costos Estimados (Sepolia)

- Despliegue: ~0.002 ETH
- Mint: ~0.0003 ETH
- Evolve: ~0.0001 ETH

## Integracion con el Agente

El NFT representa visualmente la identidad de entropiav2:
- Concepto de **entropia** organizada
- **Blockchain** representada por bloques/conexiones
- **IA** representada por redes neurales
- **Evolucion** como metáfora de crecimiento creativo
