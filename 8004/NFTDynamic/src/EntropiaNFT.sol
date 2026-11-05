// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/ERC721.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/access/Ownable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/Strings.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/utils/ReentrancyGuard.sol";

contract EntropiaNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    Ownable,
    ReentrancyGuard
{
    enum State {
        Semilla,    // 0 - Semilla de entropia
        Germinacion, // 1 - Germinacion
        Florecimiento, // 2 - Florecimiento
        Transcendencia  // 3 - Transcendencia
    }

    struct NFTData {
        State state;
        uint64 lastEvolvedAt;
        uint256 randomSeed;
        uint256 mintedAt;
        string agentName;
    }

    mapping(uint256 => NFTData) private _nftData;

    uint256 public constant EVOLUTION_PERIOD = 2 minutes;
    uint256 public constant MAX_STATES = 4;
    uint256 private _nextTokenId;
    string private _baseTokenURI;
    string public constant AGENT_NAME = "entropiav2";

    event Evolved(uint256 indexed tokenId, State oldState, State newState);
    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 timestamp);

    constructor(
        string memory name,
        string memory symbol
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _nextTokenId = 1;
    }

    function mint(address to) public onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId;
        _nextTokenId++;
        
        _safeMint(to, tokenId);
        
        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            tokenId,
            to,
            blockhash(block.number - 1)
        )));
        
        _nftData[tokenId] = NFTData({
            state: State.Semilla,
            lastEvolvedAt: uint64(block.timestamp),
            randomSeed: randomSeed,
            mintedAt: block.timestamp,
            agentName: AGENT_NAME
        });

        _setTokenURI(tokenId, _generateURI(tokenId));
        
        emit NFTMinted(tokenId, to, block.timestamp);
        return tokenId;
    }

    function mintBatch(address to, uint256 quantity) public onlyOwner {
        for (uint256 i = 0; i < quantity; i++) {
            mint(to);
        }
    }

    function evolve(uint256 tokenId) public nonReentrant {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        require(ownerOf(tokenId) == msg.sender, "Not owner");

        NFTData storage data = _nftData[tokenId];
        require(data.state < State.Transcendencia, "Already at max evolution");
        
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        require(elapsed >= EVOLUTION_PERIOD, "Not enough time passed");

        State oldState = data.state;
        data.state = State(uint8(oldState) + 1);
        data.lastEvolvedAt = uint64(block.timestamp);

        _setTokenURI(tokenId, _generateURI(tokenId));
        
        emit Evolved(tokenId, oldState, data.state);
    }

    function checkAndEvolve(uint256 tokenId) public {
        NFTData storage data = _nftData[tokenId];
        
        if (data.state == State.Transcendencia) return;
        
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        uint256 evolutionsPossible = elapsed / EVOLUTION_PERIOD;
        
        if (evolutionsPossible > 0) {
            State oldState = data.state;
            uint8 newStateValue = uint8(data.state) + uint8(evolutionsPossible);
            if (newStateValue >= uint8(State.Transcendencia)) {
                data.state = State.Transcendencia;
            } else {
                data.state = State(newStateValue);
            }
            data.lastEvolvedAt = uint64(block.timestamp);
            
            _setTokenURI(tokenId, _generateURI(tokenId));
            emit Evolved(tokenId, oldState, data.state);
        }
    }

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = super._update(to, tokenId, auth);
        
        if (from != address(0) && to != address(0)) {
            require(
                _nftData[tokenId].state != State.Semilla,
                "NFT must evolve from Semilla before transfer"
            );
        }
        
        return from;
    }

    function _generateURI(uint256 tokenId) internal view returns (string memory) {
        NFTData storage data = _nftData[tokenId];
        string memory stateName = _stateToString(data.state);
        string memory svg = _generateSVG(data.state, data.randomSeed, tokenId);
        
        string memory json = string(abi.encodePacked(
            '{',
            '"name": "entropiav2 #', Strings.toString(tokenId), ' - ', stateName, '",',
            '"description": "Agente creativo blockchain x IA. Arte generativo evolutivo que representa la identidad de entropiav2.",',
            '"image": "data:image/svg+xml;base64,', _base64Encode(bytes(svg)), '",',
            '"external_url": "https://www.8004scan.io/",',
            '"attributes": [',
            '{"trait_type": "Estado", "value": "', stateName, '"},',
            '{"trait_type": "Evolucion", "value": ', Strings.toString(uint8(data.state) + 1), ', "max_value": 4},',
            '{"trait_type": "Agente", "value": "entropiav2"},',
            '{"trait_type": "Blockchain", "value": "Ethereum Sepolia"},',
            '{"trait_type": "Seed", "display_type": "number", "value": ', Strings.toString(data.randomSeed % 100000), '},',
            '{"trait_type": "Minted", "display_type": "date", "value": ', Strings.toString(data.mintedAt), '}',
            ']',
            '}'
        ));
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            _base64Encode(bytes(json))
        ));
    }

    function _generateSVG(State state, uint256 seed, uint256 tokenId) internal pure returns (string memory) {
        string memory[4] memory stateColors = [
            "hsl(280, 70%, 15%)",    // Semilla: violeta oscuro
            "hsl(200, 80%, 12%)",    // Germinacion: azul oscuro  
            "hsl(160, 70%, 10%)",    // Florecimiento: verde oscuro
            "hsl(30, 90%, 8%)"       // Transcendencia: dorado oscuro
        ];
        
        string memory[4] memory accentColors = [
            "hsl(280, 90%, 60%)",    // Semilla: violeta brillante
            "hsl(200, 100%, 50%)",   // Germinacion: cyan
            "hsl(160, 90%, 50%)",    // Florecimiento: verde
            "hsl(45, 100%, 60%)"     // Transcendencia: dorado
        ];

        uint256 stateIndex = uint8(state);
        string memory bgColor = stateColors[stateIndex];
        string memory accentColor = accentColors[stateIndex];
        
        uint256 complexity = (stateIndex + 1) * 8;
        uint256 numParticles = 20 + (stateIndex * 15);
        
        string memory particles = _generateParticles(seed, numParticles, accentColor, stateIndex);
        string memory centralShape = _generateCentralShape(state, seed, accentColor);
        string memory neuralNetwork = _generateNeuralNetwork(state, seed, accentColor);
        string memory entropyLines = _generateEntropyLines(state, seed, accentColor);

        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">',
            '<defs>',
            '<radialGradient id="bg" cx="50%" cy="50%" r="70%">',
            '<stop offset="0%" stop-color="', bgColor, '"/>',
            '<stop offset="100%" stop-color="hsl(0, 0%, 5%)"/>',
            '</radialGradient>',
            '<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">',
            '<feGaussianBlur stdDeviation="3" result="blur"/>',
            '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>',
            '</filter>',
            '<filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">',
            '<feGaussianBlur stdDeviation="8" result="blur"/>',
            '<feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>',
            '</filter>',
            '</defs>',
            '<rect width="512" height="512" fill="url(#bg)"/>',
            entropyLines,
            neuralNetwork,
            particles,
            centralShape,
            '<text x="256" y="480" text-anchor="middle" fill="', accentColor, '" font-family="monospace" font-size="12" opacity="0.8">entropiav2 #', Strings.toString(tokenId), '</text>',
            '<text x="256" y="495" text-anchor="middle" fill="', accentColor, '" font-family="monospace" font-size="10" opacity="0.5">', _stateToString(state), '</text>',
            '</svg>'
        ));
    }

    function _generateCentralShape(State state, uint256 seed, string memory color) internal pure returns (string memory) {
        uint256 stateIndex = uint8(state);
        string memory svg = "";
        
        if (stateIndex == 0) {
            svg = string(abi.encodePacked(
                '<circle cx="256" cy="256" r="30" fill="none" stroke="', color, '" stroke-width="2" filter="url(#glow)" opacity="0.9">',
                '<animate attributeName="r" values="25;35;25" dur="3s" repeatCount="indefinite"/>',
                '<animate attributeName="opacity" values="0.9;0.5;0.9" dur="3s" repeatCount="indefinite"/>',
                '</circle>',
                '<circle cx="256" cy="256" r="15" fill="', color, '" opacity="0.7">',
                '<animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>',
                '</circle>'
            ));
        } else if (stateIndex == 1) {
            svg = string(abi.encodePacked(
                '<polygon points="256,220 290,256 256,292 222,256" fill="none" stroke="', color, '" stroke-width="2" filter="url(#glow)">',
                '<animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="20s" repeatCount="indefinite"/>',
                '</polygon>',
                '<polygon points="256,235 275,256 256,277 237,256" fill="', color, '" opacity="0.6">',
                '<animateTransform attributeName="transform" type="rotate" from="360 256 256" to="0 256 256" dur="15s" repeatCount="indefinite"/>',
                '</polygon>'
            ));
        } else if (stateIndex == 2) {
            svg = string(abi.encodePacked(
                '<g filter="url(#glow)">',
                '<polygon points="256,180 310,230 295,300 217,300 202,230" fill="none" stroke="', color, '" stroke-width="2">',
                '<animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="30s" repeatCount="indefinite"/>',
                '</polygon>',
                '<polygon points="256,200 290,235 280,280 232,280 222,235" fill="', color, '" opacity="0.5">',
                '<animateTransform attributeName="transform" type="rotate" from="360 256 256" to="0 256 256" dur="25s" repeatCount="indefinite"/>',
                '</polygon>',
                '</g>'
            ));
        } else {
            svg = string(abi.encodePacked(
                '<g filter="url(#softGlow)">',
                '<circle cx="256" cy="256" r="60" fill="none" stroke="', color, '" stroke-width="1" opacity="0.5">',
                '<animate attributeName="r" values="55;65;55" dur="4s" repeatCount="indefinite"/>',
                '</circle>',
                '<polygon points="256,190 315,230 300,300 212,300 197,230" fill="none" stroke="', color, '" stroke-width="2">',
                '<animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="40s" repeatCount="indefinite"/>',
                '</polygon>',
                '<polygon points="256,205 300,240 288,290 224,290 212,240" fill="', color, '" opacity="0.4">',
                '<animateTransform attributeName="transform" type="rotate" from="360 256 256" to="0 256 256" dur="35s" repeatCount="indefinite"/>',
                '</polygon>',
                '<circle cx="256" cy="256" r="25" fill="', color, '" opacity="0.8">',
                '<animate attributeName="opacity" values="0.8;0.4;0.8" dur="2s" repeatCount="indefinite"/>',
                '</circle>',
                '</g>'
            ));
        }
        
        return svg;
    }

    function _generateParticles(uint256 seed, uint256 count, string memory color, uint256 stateIndex) internal pure returns (string memory) {
        string memory particles = "";
        
        for (uint256 i = 0; i < count && i < 65; i++) {
            uint256 randX = uint256(keccak256(abi.encodePacked(seed, i, "x"))) % 400 + 56;
            uint256 randY = uint256(keccak256(abi.encodePacked(seed, i, "y"))) % 400 + 56;
            uint256 randSize = uint256(keccak256(abi.encodePacked(seed, i, "s"))) % 4 + 1;
            uint256 randOpacity = (uint256(keccak256(abi.encodePacked(seed, i, "o"))) % 50) + 30;
            uint256 randDuration = (uint256(keccak256(abi.encodePacked(seed, i, "d"))) % 4) + 2;
            
            particles = string(abi.encodePacked(
                particles,
                '<circle cx="', Strings.toString(randX), '" cy="', Strings.toString(randY), '" r="', 
                Strings.toString(randSize), '" fill="', color, '" opacity="', 
                Strings.toString(randOpacity), '">',
                '<animate attributeName="opacity" values="', Strings.toString(randOpacity), ';', 
                Strings.toString(randOpacity / 3), ';', Strings.toString(randOpacity), '" dur="', 
                Strings.toString(randDuration), 's" repeatCount="indefinite"/>',
                '</circle>'
            ));
        }
        
        return particles;
    }

    function _generateNeuralNetwork(State state, uint256 seed, string memory color) internal pure returns (string memory) {
        uint256 stateIndex = uint8(state);
        if (stateIndex < 2) return "";
        
        string memory svg = '<g opacity="0.3" filter="url(#glow)">';
        uint256 numNodes = 5 + (stateIndex * 3);
        
        for (uint256 i = 0; i < numNodes && i < 12; i++) {
            uint256 x1 = uint256(keccak256(abi.encodePacked(seed, i, "n1x"))) % 300 + 106;
            uint256 y1 = uint256(keccak256(abi.encodePacked(seed, i, "n1y"))) % 300 + 106;
            uint256 x2 = uint256(keccak256(abi.encodePacked(seed, i, "n2x"))) % 300 + 106;
            uint256 y2 = uint256(keccak256(abi.encodePacked(seed, i, "n2y"))) % 300 + 106;
            
            svg = string(abi.encodePacked(
                svg,
                '<line x1="', Strings.toString(x1), '" y1="', Strings.toString(y1), 
                '" x2="', Strings.toString(x2), '" y2="', Strings.toString(y2), 
                '" stroke="', color, '" stroke-width="1"/>'
            ));
        }
        
        return string(abi.encodePacked(svg, '</g>'));
    }

    function _generateEntropyLines(State state, uint256 seed, string memory color) internal pure returns (string memory) {
        uint256 stateIndex = uint8(state);
        if (stateIndex < 3) return "";
        
        string memory svg = '<g opacity="0.15">';
        
        for (uint256 i = 0; i < 8; i++) {
            uint256 y = (i * 64) + 32;
            uint256 offset = uint256(keccak256(abi.encodePacked(seed, i))) % 40;
            
            svg = string(abi.encodePacked(
                svg,
                '<path d="M 0 ', Strings.toString(y), ' Q 128 ', Strings.toString(y + offset - 20), 
                ', 256 ', Strings.toString(y), ' T 512 ', Strings.toString(y), 
                '" stroke="', color, '" stroke-width="0.5" fill="none"/>'
            ));
        }
        
        return string(abi.encodePacked(svg, '</g>'));
    }

    function _stateToString(State state) internal pure returns (string memory) {
        if (state == State.Semilla) return "Semilla";
        if (state == State.Germinacion) return "Germinacion";
        if (state == State.Florecimiento) return "Florecimiento";
        return "Transcendencia";
    }

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
        
        if (data.state == State.Transcendencia) return 0;
        
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        if (elapsed >= EVOLUTION_PERIOD) return 0;
        return EVOLUTION_PERIOD - elapsed;
    }

    function getNFTData(uint256 tokenId) public view returns (
        State state,
        uint256 lastEvolvedAt,
        uint256 randomSeed,
        uint256 mintedAt,
        string memory agentName
    ) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        NFTData storage data = _nftData[tokenId];
        return (data.state, data.lastEvolvedAt, data.randomSeed, data.mintedAt, data.agentName);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

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
