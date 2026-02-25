const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VideoDanzaNFT", function () {
  let videoDanzaNFT;
  let owner, user1, user2;
  const MINT_PRICE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const VideoDanzaNFT = await ethers.getContractFactory("VideoDanzaNFT");
    videoDanzaNFT = await VideoDanzaNFT.deploy(owner.address);
    await videoDanzaNFT.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await videoDanzaNFT.owner()).to.equal(owner.address);
    });

    it("Should have correct initial mint price", async function () {
      expect(await videoDanzaNFT.mintPrice()).to.equal(MINT_PRICE);
    });

    it("Should initialize total supply to 0", async function () {
      expect(await videoDanzaNFT.totalSupply()).to.equal(0);
    });

    it("Should have correct name and symbol", async function () {
      expect(await videoDanzaNFT.name()).to.equal("VideoDanza");
      expect(await videoDanzaNFT.symbol()).to.equal("VDANZA");
    });
  });

  describe("Minting", function () {
    it("Should mint NFT with seed and metadata", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed-123"));
      const metadataURI = "ipfs://QmTestMetadata123";

      const tx = await videoDanzaNFT
        .connect(user1)
        .mint(metadataURI, seed, { value: MINT_PRICE });

      const receipt = await tx.wait();
      expect(receipt).not.to.be.null;

      // Verificar que el token fue acuñado
      expect(await videoDanzaNFT.totalSupply()).to.equal(1);

      // Verificar que el usuario posee el token
      expect(await videoDanzaNFT.ownerOf(0)).to.equal(user1.address);

      // Verificar que el seed se almacenó
      const storedSeed = await videoDanzaNFT.getSeed(0);
      expect(storedSeed).to.equal(seed);

      // Verificar metadata URI
      expect(await videoDanzaNFT.tokenURI(0)).to.equal(metadataURI);
    });

    it("Should reject duplicate seed", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("duplicate-seed"));
      const metadataURI = "ipfs://QmMetadata";

      // Primer mint
      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      // Segundo mint con el mismo seed debe fallar
      await expect(
        videoDanzaNFT.connect(user2).mint(metadataURI, seed, {
          value: MINT_PRICE,
        })
      ).to.be.revertedWith("VideoDanzaNFT: Seed already minted");
    });

    it("Should reject insufficient payment", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://Qm";

      await expect(
        videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
          value: ethers.parseEther("0.0001"),
        })
      ).to.be.revertedWith("VideoDanzaNFT: Insufficient payment");
    });

    it("Should reject empty metadata URI", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));

      await expect(
        videoDanzaNFT.connect(user1).mint("", seed, { value: MINT_PRICE })
      ).to.be.revertedWith("VideoDanzaNFT: Metadata URI required");
    });

    it("Should increment token IDs correctly", async function () {
      const seed1 = ethers.keccak256(ethers.toUtf8Bytes("seed-1"));
      const seed2 = ethers.keccak256(ethers.toUtf8Bytes("seed-2"));
      const metadataURI = "ipfs://QmMetadata";

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed1, {
        value: MINT_PRICE,
      });

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed2, {
        value: MINT_PRICE,
      });

      expect(await videoDanzaNFT.totalSupply()).to.equal(2);
      expect(await videoDanzaNFT.ownerOf(0)).to.equal(user1.address);
      expect(await videoDanzaNFT.ownerOf(1)).to.equal(user1.address);
    });

    it("Should emit Minted event", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://QmMetadata";

      await expect(
        videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
          value: MINT_PRICE,
        })
      )
        .to.emit(videoDanzaNFT, "Minted")
        .withArgs(0, user1.address, seed, metadataURI);
    });
  });

  describe("Seed Management", function () {
    it("Should retrieve seed from token ID", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("unique-seed"));
      const metadataURI = "ipfs://QmMetadata";

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      const retrievedSeed = await videoDanzaNFT.getSeed(0);
      expect(retrievedSeed).to.equal(seed);
    });

    it("Should check if seed is minted", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("check-seed"));
      const metadataURI = "ipfs://QmMetadata";

      expect(await videoDanzaNFT.isSeedMinted(seed)).to.be.false;

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      expect(await videoDanzaNFT.isSeedMinted(seed)).to.be.true;
    });

    it("Should reject getSeed for non-existent token", async function () {
      await expect(videoDanzaNFT.getSeed(999)).to.be.revertedWith(
        "VideoDanzaNFT: Token does not exist"
      );
    });
  });

  describe("Metadata Management", function () {
    it("Should update metadata", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const oldURI = "ipfs://QmOldMetadata";
      const newURI = "ipfs://QmNewMetadata";

      await videoDanzaNFT.connect(user1).mint(oldURI, seed, {
        value: MINT_PRICE,
      });

      await videoDanzaNFT.connect(user1).updateMetadata(0, newURI);

      expect(await videoDanzaNFT.tokenURI(0)).to.equal(newURI);
    });

    it("Should reject metadata update from non-owner", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://QmMetadata";
      const newURI = "ipfs://QmNewMetadata";

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      await expect(
        videoDanzaNFT.connect(user2).updateMetadata(0, newURI)
      ).to.be.revertedWith("VideoDanzaNFT: Not token owner");
    });

    it("Should emit MetadataUpdated event", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const oldURI = "ipfs://QmOldMetadata";
      const newURI = "ipfs://QmNewMetadata";

      await videoDanzaNFT.connect(user1).mint(oldURI, seed, {
        value: MINT_PRICE,
      });

      await expect(videoDanzaNFT.connect(user1).updateMetadata(0, newURI))
        .to.emit(videoDanzaNFT, "MetadataUpdated")
        .withArgs(0, newURI);
    });
  });

  describe("Price Management", function () {
    it("Should update mint price", async function () {
      const newPrice = ethers.parseEther("0.002");
      await videoDanzaNFT.connect(owner).updateMintPrice(newPrice);

      expect(await videoDanzaNFT.mintPrice()).to.equal(newPrice);
    });

    it("Should reject price update from non-owner", async function () {
      const newPrice = ethers.parseEther("0.002");

      await expect(
        videoDanzaNFT.connect(user1).updateMintPrice(newPrice)
      ).to.be.revertedWithCustomError(videoDanzaNFT, "OwnableUnauthorizedAccount");
    });

    it("Should reject zero price", async function () {
      await expect(
        videoDanzaNFT.connect(owner).updateMintPrice(0)
      ).to.be.revertedWith("VideoDanzaNFT: Price must be positive");
    });

    it("Should emit MintPriceUpdated event", async function () {
      const newPrice = ethers.parseEther("0.002");

      await expect(videoDanzaNFT.connect(owner).updateMintPrice(newPrice))
        .to.emit(videoDanzaNFT, "MintPriceUpdated")
        .withArgs(newPrice);
    });
  });

  describe("Royalties (ERC2981)", function () {
    it("Should set default royalties to 7.5%", async function () {
      const salePrice = ethers.parseEther("100");
      const [royaltyReceiver, royaltyAmount] =
        await videoDanzaNFT.royaltyInfo(0, salePrice);

      expect(royaltyReceiver).to.equal(owner.address);
      // 7.5% de 100 ETH = 7.5 ETH
      expect(royaltyAmount).to.equal(ethers.parseEther("7.5"));
    });

    it("Should calculate royalties correctly for different sale prices", async function () {
      const salePrice1000 = ethers.parseEther("1000");
      const [, royaltyAmount] = await videoDanzaNFT.royaltyInfo(0, salePrice1000);

      // 7.5% de 1000 ETH = 75 ETH
      expect(royaltyAmount).to.equal(ethers.parseEther("75"));
    });
  });

  describe("Funds Management", function () {
    it("Should accept ETH in mint", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://QmMetadata";

      const balanceBefore = await ethers.provider.getBalance(
        videoDanzaNFT.getAddress()
      );

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      const balanceAfter = await ethers.provider.getBalance(
        videoDanzaNFT.getAddress()
      );

      expect(balanceAfter).to.equal(balanceBefore + MINT_PRICE);
    });

    it("Should withdraw funds to owner", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://QmMetadata";

      // Mint y acumular fondos
      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      const ownerBalanceBefore = await ethers.provider.getBalance(
        owner.address
      );

      const tx = await videoDanzaNFT.connect(owner).withdraw();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;

      const ownerBalanceAfter = await ethers.provider.getBalance(owner.address);

      expect(ownerBalanceAfter).to.equal(
        ownerBalanceBefore + MINT_PRICE - gasCost
      );

      const contractBalance = await ethers.provider.getBalance(
        videoDanzaNFT.getAddress()
      );
      expect(contractBalance).to.equal(0);
    });

    it("Should reject withdraw when no funds available", async function () {
      await expect(videoDanzaNFT.connect(owner).withdraw()).to.be.revertedWith(
        "VideoDanzaNFT: No funds to withdraw"
      );
    });

    it("Should emit Withdrawn event", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://QmMetadata";

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      await expect(videoDanzaNFT.connect(owner).withdraw())
        .to.emit(videoDanzaNFT, "Withdrawn")
        .withArgs(owner.address, MINT_PRICE);
    });
  });

  describe("ERC721 Standard", function () {
    it("Should support ERC721 interface", async function () {
      // ERC721 interface ID: 0x80ac58cd
      expect(await videoDanzaNFT.supportsInterface("0x80ac58cd")).to.be.true;
    });

    it("Should support ERC2981 interface", async function () {
      // ERC2981 interface ID: 0x2a55205a
      expect(await videoDanzaNFT.supportsInterface("0x2a55205a")).to.be.true;
    });

    it("Should transfer token correctly", async function () {
      const seed = ethers.keccak256(ethers.toUtf8Bytes("test-seed"));
      const metadataURI = "ipfs://QmMetadata";

      await videoDanzaNFT.connect(user1).mint(metadataURI, seed, {
        value: MINT_PRICE,
      });

      await videoDanzaNFT
        .connect(user1)
        .transferFrom(user1.address, user2.address, 0);

      expect(await videoDanzaNFT.ownerOf(0)).to.equal(user2.address);
    });
  });
});
