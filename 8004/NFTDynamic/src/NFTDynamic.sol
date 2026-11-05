// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// OpenZeppelin Contracts v5.0.0
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/Strings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/ReentrancyGuard.sol";

contract NFTDynamic is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    Ownable,
    ReentrancyGuard
{
    // === Estados del NFT ===
    enum State {
        Egg,       // 0
        Hatchling, // 1
        Adult,     // 2
        Elder      // 3
    }

    struct NFTData {
        State state;
        uint64 lastEvolvedAt;
        uint256 randomSeed;
        uint256 mintedAt;
    }

    mapping(uint256 => NFTData) private _nftData;

    // === Configuración ===
    uint256 public constant EVOLUTION_PERIOD = 2 minutes; // 2 minutos para demo (cambiar a 7 days en producción)
    uint256 public constant MAX_STATES = 4;
    uint256 private _nextTokenId;
    
    // Base URI para metadata
    string private _baseTokenURI;

    // === Eventos ===
    event Evolved(uint256 indexed tokenId, State oldState, State newState);
    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 timestamp);

    // === Constructor ===
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseURI;
        _nextTokenId = 1;
    }

    // === Minting ===
    function mint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        
        // Generar semilla pseudoaleatoria
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            tokenId,
            to
        )));
        
        _nftData[tokenId] = NFTData({
            state: State.Egg,
            lastEvolvedAt: uint64(block.timestamp),
            randomSeed: randomSeed,
            mintedAt: block.timestamp
        });

        _setTokenURI(tokenId, _generateURI(tokenId));
        
        emit NFTMinted(tokenId, to, block.timestamp);
        return tokenId;
    }

    // === Mint Multiple ===
    function mintBatch(address to, uint256 quantity) public onlyOwner {
        for (uint256 i = 0; i < quantity; i++) {
            mint(to);
        }
    }

    // === Evolución ===
    function evolve(uint256 tokenId) public nonReentrant {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        NFTData storage data = _nftData[tokenId];
        require(data.state < State.Elder, "Already at max evolution");
        
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        require(elapsed >= EVOLUTION_PERIOD, "Not enough time passed");

        State oldState = data.state;
        data.state = State(uint8(oldState) + 1);
        data.lastEvolvedAt = uint64(block.timestamp);

        // Actualizar URI
        _setTokenURI(tokenId, _generateURI(tokenId));
        
        emit Evolved(tokenId, oldState, data.state);
    }

    // === Evolución Automática (llamar para actualizar estado) ===
    function checkAndEvolve(uint256 tokenId) public {
        NFTData storage data = _nftData[tokenId];
        
        if (data.state == State.Elder) return;
        
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        uint256 evolutionsPossible = elapsed / EVOLUTION_PERIOD;
        
        if (evolutionsPossible > 0) {
            State oldState = data.state;
            uint8 newStateValue = uint8(data.state) + uint8(evolutionsPossible);
            if (newStateValue >= uint8(State.Elder)) {
                data.state = State.Elder;
            } else {
                data.state = State(newStateValue);
            }
            data.lastEvolvedAt = uint64(block.timestamp);
            
            _setTokenURI(tokenId, _generateURI(tokenId));
            emit Evolved(tokenId, oldState, data.state);
        }
    }

    // === Transferencia: Bloquear hasta Hatchling ===
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = super._update(to, tokenId, auth);
        
        // Bloquear transferencia si está en estado Egg (excepto mint/burn)
        if (from != address(0) && to != address(0)) {
            require(
                _nftData[tokenId].state != State.Egg,
                "NFT must evolve from Egg before transfer"
            );
        }
        
        return from;
    }

    // === Generar URI dinámico ===
    function _generateURI(uint256 tokenId) internal view returns (string memory) {
        NFTData storage data = _nftData[tokenId];
        string memory stateName = _stateToString(data.state);
        
        // Si tienes IPFS, usa: return string(abi.encodePacked(_baseTokenURI, stateName, "/", Strings.toString(tokenId), ".json"));
        // Para demo, usamos un ejemplo de metadata inline
        return _generateInlineMetadata(tokenId, stateName);
    }

    function _generateInlineMetadata(uint256 tokenId, string memory stateName) internal view returns (string memory) {
        NFTData storage data = _nftData[tokenId];
        
        // Generar JSON de metadata codificado en base64
        string memory json = string(abi.encodePacked(
            '{',
            '"name": "Evolving NFT #', Strings.toString(tokenId), '",',
            '"description": "An NFT that evolves over time",',
            '"image": "', _getImageURI(data.state), '",',
            '"attributes": [',
            '{"trait_type": "State", "value": "', stateName, '"},',
            '{"trait_type": "Evolution", "value": "', Strings.toString(uint8(data.state) + 1), '/', Strings.toString(MAX_STATES), '"},',
            '{"trait_type": "Random Seed", "display_type": "number", "value": ', Strings.toString(data.randomSeed % 10000), '}',
            ']',
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(bytes(json))
        ));
    }

    function _getImageURI(State state) internal pure returns (string memory) {
        // URLs de ejemplo - reemplazar con tus imágenes reales
        if (state == State.Egg) {
            return "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/docs/images/egg.png";
        } else if (state == State.Hatchling) {
            return "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/docs/images/baby.png";
        } else if (state == State.Adult) {
            return "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/docs/images/adult.png";
        } else {
            return "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-contracts/master/docs/images/elder.png";
        }
    }

    function _stateToString(State state) internal pure returns (string memory) {
        if (state == State.Egg) return "Egg";
        if (state == State.Hatchling) return "Hatchling";
        if (state == State.Adult) return "Adult";
        return "Elder";
    }

    // === Base64 Encoding ===
    string internal constant TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";

        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        bytes memory result = new bytes(encodedLen + 32);

        bytes memory table = bytes(TABLE);

        assembly {
            let tablePtr := add(table, 1)
            let resultPtr := add(result, 32)

            for {
                let i := 0
            } lt(i, data.length) {

            } {
                i := add(i, 3)
                let input := and(mload(add(data, i)), 0xffffff)

                let out := mload(add(tablePtr, and(shr(18, input), 0x3F)))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(12, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(shr(6, input), 0x3F))), 0xFF))
                out := shl(8, out)
                out := add(out, and(mload(add(tablePtr, and(input, 0x3F))), 0xFF))
                out := shl(224, out)

                mstore(resultPtr, out)

                resultPtr := add(resultPtr, 4)
            }

            switch mod(data.length, 3)
            case 1 {
                mstore(sub(resultPtr, 2), shl(240, 0x3d3d))
            }
            case 2 {
                mstore(sub(resultPtr, 1), shl(248, 0x3d))
            }

            mstore(result, encodedLen)
        }

        return string(result);
    }

    // === Getters ===
    function getState(uint256 tokenId) public view returns (State) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return _nftData[tokenId].state;
    }

    function getLastEvolvedAt(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return _nftData[tokenId].lastEvolvedAt;
    }

    function getTimeUntilNextEvolution(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        NFTData storage data = _nftData[tokenId];
        
        if (data.state == State.Elder) return 0;
        
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        if (elapsed >= EVOLUTION_PERIOD) return 0;
        return EVOLUTION_PERIOD - elapsed;
    }

    function getRandomSeed(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return _nftData[tokenId].randomSeed;
    }

    function getMintedAt(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return _nftData[tokenId].mintedAt;
    }

    function getNFTData(uint256 tokenId) public view returns (
        State state,
        uint256 lastEvolvedAt,
        uint256 randomSeed,
        uint256 mintedAt
    ) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        NFTData storage data = _nftData[tokenId];
        return (data.state, data.lastEvolvedAt, data.randomSeed, data.mintedAt);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // === Administración ===
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    receive() external payable {}
    fallback() external payable {}
}
