// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/NFTDynamic.sol";

contract DeployNFTDynamic is Script {
    function setUp() public {}

    function run() public {
        // Cargar variables de entorno
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        // Configuración del contrato
        string memory name = "Evolving NFT";
        string memory symbol = "ENFT";
        string memory baseURI = ""; // Metadata inline por defecto
        
        vm.startBroadcast(deployerPrivateKey);
        
        // Desplegar contrato
        NFTDynamic nft = new NFTDynamic(name, symbol, baseURI);
        
        // Mintear algunos NFTs de ejemplo
        nft.mint(msg.sender);
        nft.mint(msg.sender);
        nft.mint(msg.sender);
        
        vm.stopBroadcast();
        
        // Log de la dirección del contrato
        console.log("NFTDynamic desplegado en:", address(nft));
        console.log("Nombre:", name);
        console.log("Simbolo:", symbol);
        console.log("Total minteado:", nft.balanceOf(msg.sender));
    }
}
