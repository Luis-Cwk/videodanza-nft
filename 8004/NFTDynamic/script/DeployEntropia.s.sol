// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/EntropiaNFT.sol";

contract DeployEntropia is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);
        
        EntropiaNFT nft = new EntropiaNFT(
            "entropiav2",      // name
            "ENTRO"            // symbol
        );
        
        console.log("EntropiaNFT deployed at:", address(nft));
        
        // Mint first NFT to deployer
        address deployer = vm.addr(deployerPrivateKey);
        uint256 tokenId = nft.mint(deployer);
        console.log("First NFT minted with tokenId:", tokenId);
        
        vm.stopBroadcast();
    }
}
