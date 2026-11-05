// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EntropiaNFT is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable, ReentrancyGuard {
    
    enum State { Semilla, Germinacion, Florecimiento, Transcendencia }

    struct NFTData {
        State state;
        uint64 lastEvolvedAt;
        uint256 randomSeed;
        uint256 mintedAt;
    }

    mapping(uint256 => NFTData) private _nftData;
    uint256 public constant EVOLUTION_PERIOD = 2 minutes;
    uint256 private _nextTokenId;

    event Evolved(uint256 indexed tokenId, State oldState, State newState);
    event NFTMinted(uint256 indexed tokenId, address indexed owner, uint256 timestamp);

    constructor() ERC721("entropiav2", "ENTRO") Ownable(msg.sender) {
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
            to
        )));
        
        _nftData[tokenId] = NFTData({
            state: State.Semilla,
            lastEvolvedAt: uint64(block.timestamp),
            randomSeed: randomSeed,
            mintedAt: block.timestamp
        });

        _setTokenURI(tokenId, _generateURI(tokenId));
        emit NFTMinted(tokenId, to, block.timestamp);
        return tokenId;
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

    function _update(address to, uint256 tokenId, address auth) 
        internal override(ERC721, ERC721Enumerable) returns (address) 
    {
        address from = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0)) {
            require(_nftData[tokenId].state != State.Semilla, "Must evolve from Semilla before transfer");
        }
        return from;
    }

    function _generateURI(uint256 tokenId) internal view returns (string memory) {
        NFTData storage data = _nftData[tokenId];
        string memory stateName = _getStateName(data.state);
        string memory svg = _generateSVG(data.state, data.randomSeed, tokenId);
        
        string memory json = string(abi.encodePacked(
            '{"name":"entropiav2 #', Strings.toString(tokenId), ' - ', stateName, '",',
            '"description":"Agente creativo blockchain x IA. Arte generativo evolutivo.",',
            '"image":"data:image/svg+xml;base64,', _base64Encode(bytes(svg)), '",',
            '"attributes":[',
            '{"trait_type":"Estado","value":"', stateName, '"},',
            '{"trait_type":"Evolucion","value":', Strings.toString(uint8(data.state) + 1), ',"max_value":4},',
            '{"trait_type":"Agente","value":"entropiav2"},',
            '{"trait_type":"Seed","value":', Strings.toString(data.randomSeed % 10000), '}',
            ']}'
        ));
        
        return string(abi.encodePacked("data:application/json;base64,", _base64Encode(bytes(json))));
    }

    function _generateSVG(State state, uint256 seed, uint256 tokenId) internal pure returns (string memory) {
        uint256 si = uint8(state);
        
        string memory accent = _getAccentColor(si);
        string memory bg = _getBgColor(si);
        string memory shape = _getShape(si, accent);
        string memory particles = _generateParticles(seed, accent);
        
        return string(abi.encodePacked(
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
            '<rect width="512" height="512" fill="', bg, '"/>',
            '<defs>',
            '<filter id="g"><feGaussianBlur stdDeviation="2"/></filter>',
            '</defs>',
            particles,
            shape,
            '<text x="256" y="475" text-anchor="middle" fill="', accent, '" font-family="monospace" font-size="16" filter="url(#g)">entropiav2</text>',
            '<text x="256" y="495" text-anchor="middle" fill="', accent, '" font-family="monospace" font-size="11" opacity="0.7">#', Strings.toString(tokenId), ' ', _getStateName(state), '</text>',
            '</svg>'
        ));
    }

    function _getAccentColor(uint256 stateIndex) internal pure returns (string memory) {
        if (stateIndex == 0) return "#bf5fff";
        if (stateIndex == 1) return "#00d4ff";
        if (stateIndex == 2) return "#00ff88";
        return "#ffcc00";
    }

    function _getBgColor(uint256 stateIndex) internal pure returns (string memory) {
        if (stateIndex == 0) return "#1a0a2e";
        if (stateIndex == 1) return "#0a1628";
        if (stateIndex == 2) return "#0a1a14";
        return "#1a1208";
    }

    function _getShape(uint256 stateIndex, string memory color) internal pure returns (string memory) {
        if (stateIndex == 0) {
            return string(abi.encodePacked(
                '<circle cx="256" cy="256" r="35" fill="none" stroke="', color, '" stroke-width="3">',
                '<animate attributeName="r" values="30;40;30" dur="3s" repeatCount="indefinite"/>',
                '<animate attributeName="opacity" values="1;0.5;1" dur="3s" repeatCount="indefinite"/>',
                '</circle>',
                '<circle cx="256" cy="256" r="15" fill="', color, '" opacity="0.8">',
                '<animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite"/>',
                '</circle>'
            ));
        } else if (stateIndex == 1) {
            return string(abi.encodePacked(
                '<polygon points="256,210 300,256 256,302 212,256" fill="none" stroke="', color, '" stroke-width="3">',
                '<animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="15s" repeatCount="indefinite"/>',
                '</polygon>',
                '<polygon points="256,230 285,256 256,282 227,256" fill="', color, '" opacity="0.5">',
                '<animateTransform attributeName="transform" type="rotate" from="360 256 256" to="0 256 256" dur="10s" repeatCount="indefinite"/>',
                '</polygon>'
            ));
        } else if (stateIndex == 2) {
            return string(abi.encodePacked(
                '<polygon points="256,170 320,230 300,320 212,320 192,230" fill="none" stroke="', color, '" stroke-width="2">',
                '<animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="25s" repeatCount="indefinite"/>',
                '</polygon>',
                '<polygon points="256,195 300,240 285,305 227,305 212,240" fill="', color, '" opacity="0.4">',
                '<animateTransform attributeName="transform" type="rotate" from="360 256 256" to="0 256 256" dur="20s" repeatCount="indefinite"/>',
                '</polygon>'
            ));
        } else {
            return string(abi.encodePacked(
                '<circle cx="256" cy="256" r="55" fill="none" stroke="', color, '" stroke-width="1" opacity="0.4">',
                '<animate attributeName="r" values="50;60;50" dur="4s" repeatCount="indefinite"/>',
                '</circle>',
                '<polygon points="256,180 330,240 310,330 202,330 182,240" fill="none" stroke="', color, '" stroke-width="2">',
                '<animateTransform attributeName="transform" type="rotate" from="0 256 256" to="360 256 256" dur="35s" repeatCount="indefinite"/>',
                '</polygon>',
                '<polygon points="256,210 305,250 290,315 222,315 207,250" fill="', color, '" opacity="0.3">',
                '<animateTransform attributeName="transform" type="rotate" from="360 256 256" to="0 256 256" dur="30s" repeatCount="indefinite"/>',
                '</polygon>',
                '<circle cx="256" cy="256" r="20" fill="', color, '" opacity="0.9">',
                '<animate attributeName="opacity" values="0.9;0.4;0.9" dur="2s" repeatCount="indefinite"/>',
                '</circle>'
            ));
        }
    }

    function _generateParticles(uint256 seed, string memory color) internal pure returns (string memory) {
        string memory particles = "";
        for (uint256 i = 0; i < 25; i++) {
            uint256 x = uint256(keccak256(abi.encodePacked(seed, i, "x"))) % 400 + 56;
            uint256 y = uint256(keccak256(abi.encodePacked(seed, i, "y"))) % 400 + 56;
            uint256 r = uint256(keccak256(abi.encodePacked(seed, i, "s"))) % 3 + 1;
            uint256 op = 30 + (uint256(keccak256(abi.encodePacked(seed, i, "o"))) % 40);
            particles = string(abi.encodePacked(
                particles,
                '<circle cx="', Strings.toString(x), '" cy="', Strings.toString(y), '" r="', Strings.toString(r), '" fill="', color, '" opacity="0.', Strings.toString(op), '"/>'
            ));
        }
        return particles;
    }

    function _getStateName(State s) internal pure returns (string memory) {
        if (s == State.Semilla) return "Semilla";
        if (s == State.Germinacion) return "Germinacion";
        if (s == State.Florecimiento) return "Florecimiento";
        return "Transcendencia";
    }

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        if (data.length == 0) return "";
        
        string memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 encodedLen = 4 * ((data.length + 2) / 3);
        bytes memory result = new bytes(encodedLen);
        bytes memory t = bytes(table);
        
        uint256 resultIndex = 0;
        for (uint256 i = 0; i < data.length; i += 3) {
            uint256 a = i < data.length ? uint256(uint8(data[i])) : 0;
            uint256 b = i + 1 < data.length ? uint256(uint8(data[i + 1])) : 0;
            uint256 c = i + 2 < data.length ? uint256(uint8(data[i + 2])) : 0;
            
            uint256 triple = (a << 16) | (b << 8) | c;
            
            result[resultIndex++] = t[(triple >> 18) & 0x3F];
            result[resultIndex++] = t[(triple >> 12) & 0x3F];
            result[resultIndex++] = t[(triple >> 6) & 0x3F];
            result[resultIndex++] = t[triple & 0x3F];
        }
        
        if (data.length % 3 == 1) {
            result[encodedLen - 1] = '=';
            result[encodedLen - 2] = '=';
        } else if (data.length % 3 == 2) {
            result[encodedLen - 1] = '=';
        }
        
        return string(result);
    }

    function getState(uint256 tokenId) public view returns (State) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        return _nftData[tokenId].state;
    }

    function getTimeUntilNextEvolution(uint256 tokenId) public view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "NFT does not exist");
        NFTData storage data = _nftData[tokenId];
        if (data.state == State.Transcendencia) return 0;
        uint256 elapsed = block.timestamp - data.lastEvolvedAt;
        if (elapsed >= EVOLUTION_PERIOD) return 0;
        return EVOLUTION_PERIOD - elapsed;
    }

    function getNFTData(uint256 tokenId) public view returns (State state, uint256 lastEvolvedAt, uint256 randomSeed, uint256 mintedAt) {
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
}
