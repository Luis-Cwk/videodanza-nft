// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/NFTDynamic.sol";

contract NFTDynamicTest is Test {
    NFTDynamic public nft;
    address public owner;
    address public user1;
    address public user2;

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        nft = new NFTDynamic("Evolving NFT", "ENFT", "");
    }

    function test_Deployment() public {
        assertEq(nft.name(), "Evolving NFT");
        assertEq(nft.symbol(), "ENFT");
        assertEq(nft.owner(), owner);
    }

    function test_Mint() public {
        uint256 tokenId = nft.mint(user1);
        assertEq(tokenId, 1);
        assertEq(nft.ownerOf(tokenId), user1);
        assertEq(nft.getState(tokenId), NFTDynamic.State.Egg);
    }

    function test_MintBatch() public {
        nft.mintBatch(user1, 5);
        assertEq(nft.balanceOf(user1), 5);
    }

    function test_CannotTransferEgg() public {
        uint256 tokenId = nft.mint(user1);
        
        vm.startPrank(user1);
        vm.expectRevert("NFT must evolve from Egg before transfer");
        nft.transferFrom(user1, user2, tokenId);
        vm.stopPrank();
    }

    function test_EvolveAfterTime() public {
        uint256 tokenId = nft.mint(user1);
        
        // Avanzar tiempo 2 minutos + 1 segundo
        vm.warp(block.timestamp + 2 minutes + 1);
        
        vm.prank(user1);
        nft.evolve(tokenId);
        
        assertEq(uint256(nft.getState(tokenId)), uint256(NFTDynamic.State.Hatchling));
    }

    function test_CanTransferAfterEvolve() public {
        uint256 tokenId = nft.mint(user1);
        
        vm.warp(block.timestamp + 2 minutes + 1);
        
        vm.prank(user1);
        nft.evolve(tokenId);
        
        vm.prank(user1);
        nft.transferFrom(user1, user2, tokenId);
        
        assertEq(nft.ownerOf(tokenId), user2);
    }

    function test_CannotEvolveTooSoon() public {
        uint256 tokenId = nft.mint(user1);
        
        vm.prank(user1);
        vm.expectRevert("Not enough time passed");
        nft.evolve(tokenId);
    }

    function test_MaxEvolution() public {
        uint256 tokenId = nft.mint(user1);
        
        // Evolucionar hasta Elder (3 evoluciones)
        for (uint i = 0; i < 3; i++) {
            vm.warp(block.timestamp + 2 minutes + 1);
            vm.prank(user1);
            nft.evolve(tokenId);
        }
        
        assertEq(uint256(nft.getState(tokenId)), uint256(NFTDynamic.State.Elder));
        
        // Intentar evolucionar más
        vm.warp(block.timestamp + 2 minutes + 1);
        vm.prank(user1);
        vm.expectRevert("Already at max evolution");
        nft.evolve(tokenId);
    }

    function test_CheckAndEvolve() public {
        uint256 tokenId = nft.mint(user1);
        
        // Avanzar 6 minutos (3 evoluciones posibles)
        vm.warp(block.timestamp + 6 minutes + 1);
        
        vm.prank(user1);
        nft.checkAndEvolve(tokenId);
        
        // Debería estar en estado Adult (2) o Elder (3) dependiendo de la implementación
        NFTDynamic.State state = nft.getState(tokenId);
        assertTrue(uint256(state) > uint256(NFTDynamic.State.Egg));
    }

    function test_GetTimeUntilNextEvolution() public {
        uint256 tokenId = nft.mint(user1);
        
        uint256 timeRemaining = nft.getTimeUntilNextEvolution(tokenId);
        assertEq(timeRemaining, 2 minutes);
        
        vm.warp(block.timestamp + 1 minutes);
        timeRemaining = nft.getTimeUntilNextEvolution(tokenId);
        assertEq(timeRemaining, 1 minutes);
        
        vm.warp(block.timestamp + 2 minutes);
        timeRemaining = nft.getTimeUntilNextEvolution(tokenId);
        assertEq(timeRemaining, 0);
    }

    function test_RandomSeed() public {
        uint256 tokenId1 = nft.mint(user1);
        uint256 tokenId2 = nft.mint(user1);
        
        uint256 seed1 = nft.getRandomSeed(tokenId1);
        uint256 seed2 = nft.getRandomSeed(tokenId2);
        
        // Las semillas deberían ser diferentes
        assertTrue(seed1 != seed2);
    }

    function test_TokenURI() public {
        uint256 tokenId = nft.mint(user1);
        string memory uri = nft.tokenURI(tokenId);
        
        // Debería retornar un data URI
        assertTrue(bytes(uri).length > 0);
    }

    function test_OnlyOwnerCanMint() public {
        vm.prank(user1);
        vm.expectRevert();
        nft.mint(user1);
    }

    function test_Withdraw() public {
        // Enviar ETH al contrato
        (bool success, ) = address(nft).call{value: 1 ether}("");
        require(success, "Failed to send ETH");
        
        uint256 initialBalance = address(this).balance;
        nft.withdraw();
        uint256 finalBalance = address(this).balance;
        
        assertEq(finalBalance - initialBalance, 1 ether);
    }

    receive() external payable {}
}
