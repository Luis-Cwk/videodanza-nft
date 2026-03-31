/**
 * LLM Agent - entropiav2
 * 
 * Soporta múltiples proveedores de LLM:
 * - Ollama (local, soberano, por defecto)
 * - OpenRouter (nube, qwen3.5:4b barato)
 * - OpenAI (fallback)
 * 
 * El modelo se configura desde .env
 */

import 'dotenv/config';
import { createHash } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

const LLM_PROVIDER = process.env.LLM_PROVIDER || 'ollama';
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/chat';
const MODEL = process.env.LLM_MODEL || 'qwen3.4:4b';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// ============================================================================
// Types
// ============================================================================

export interface AgentMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface CompositionParams {
  mood?: string;
  perspective?: string;
  energy?: string;
  gender?: string;
  seed?: string;
}

export interface CompositionResult {
  seed: string;
  videoIds: number[];
  musicTrack: number;
  blendMode: string;
  opacity: number;
  scale: number;
  rotation: number;
  description: string;
}

// ============================================================================
// Smart Contract Templates
// ============================================================================

const CONTRACT_TEMPLATES = {
  nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NombreDelContrato is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    uint256 private _nextTokenId;
    uint256 public maxSupply;
    uint256 public mintPrice;
    string public baseURI;
    bool public mintActive = false;

    struct TokenData {
        string userSeed;
        uint256 compositionHash;
        uint256 mintedAt;
    }
    mapping(uint256 => TokenData) public tokenData;

    constructor(
        string memory name,
        string memory symbol,
        uint256 _maxSupply,
        uint256 _mintPrice,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        maxSupply = _maxSupply;
        mintPrice = _mintPrice;
    }

    function mint(address to, string memory uri, string memory _userSeed) public payable {
        require(mintActive, "Minting not active");
        require(msg.value >= mintPrice, "Insufficient payment");
        require(_nextTokenId < maxSupply, "Max supply reached");
        
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        
        tokenData[tokenId] = TokenData({
            userSeed: _userSeed,
            compositionHash: uint256(keccak256(abi.encodePacked(_userSeed, block.timestamp, tokenId))),
            mintedAt: block.timestamp
        });
    }

    function setBaseURI(string memory _baseURI) public onlyOwner {
        baseURI = _baseURI;
    }

    function toggleMint() public onlyOwner {
        mintActive = !mintActive;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`,

  dynamic_nft: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NombreDelContrato is ERC721, ERC721URIStorage, ERC721Enumerable, Ownable {
    using Strings for uint256;

    enum State { Seed, Sprout, Bloom, Wither }

    struct NFTData {
        State state;
        uint64 lastEvolvedAt;
        uint256 randomSeed;
        uint256 mintedAt;
        string userSeed;
    }

    uint256 private _nextTokenId;
    uint256 public constant EVOLUTION_PERIOD = 7 days;
    uint256 public constant MAX_STATES = 4;
    uint256 public mintPrice;
    bool public mintActive = false;

    mapping(uint256 => NFTData) private _nftData;

    event Evolved(uint256 indexed tokenId, State oldState, State newState);
    event NFTMinted(uint256 indexed tokenId, address indexed owner, string userSeed);

    constructor(
        string memory name,
        string memory symbol,
        uint256 _mintPrice,
        address initialOwner
    ) ERC721(name, symbol) Ownable(initialOwner) {
        mintPrice = _mintPrice;
    }

    function mint(address to, string memory _userSeed) public payable returns (uint256) {
        require(mintActive, "Minting not active");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);

        uint256 randomSeed = uint256(keccak256(abi.encodePacked(
            block.timestamp, block.prevrandao, tokenId, to, _userSeed
        )));

        _nftData[tokenId] = NFTData({
            state: State.Seed,
            lastEvolvedAt: uint64(block.timestamp),
            randomSeed: randomSeed,
            mintedAt: block.timestamp,
            userSeed: _userSeed
        });

        _setTokenURI(tokenId, _generateURI(tokenId));
        emit NFTMinted(tokenId, to, _userSeed);
        return tokenId;
    }

    function evolve(uint256 tokenId) public {
        require(ownerOf(tokenId) == msg.sender, "Not owner");
        NFTData storage data = _nftData[tokenId];
        require(data.state < State.Wither, "Already at max evolution");
        require(block.timestamp - data.lastEvolvedAt >= EVOLUTION_PERIOD, "Not enough time");

        State oldState = data.state;
        data.state = State(uint8(oldState) + 1);
        data.lastEvolvedAt = uint64(block.timestamp);
        _setTokenURI(tokenId, _generateURI(tokenId));
        emit Evolved(tokenId, oldState, data.state);
    }

    function _generateURI(uint256 tokenId) internal view returns (string memory) {
        NFTData storage data = _nftData[tokenId];
        string memory stateName = _stateToString(data.state);
        return string(abi.encodePacked(
            '{"name":"', name(), ' #', tokenId.toString(), '",',
            '"description":"A generative dance NFT in state ', stateName, '",',
            '"attributes":[',
            '{"trait_type":"State","value":"', stateName, '"},',
            '{"trait_type":"Seed","value":"', data.userSeed, '"},',
            '{"trait_type":"Randomness","value":', data.randomSeed.toString(), '}',
            ']}'
        ));
    }

    function _stateToString(State state) internal pure returns (string memory) {
        if (state == State.Seed) return "Seed";
        if (state == State.Sprout) return "Sprout";
        if (state == State.Bloom) return "Bloom";
        return "Wither";
    }

    function _update(address to, uint256 tokenId, address auth)
        internal override(ERC721, ERC721Enumerable) returns (address) {
        address from = super._update(to, tokenId, auth);
        if (from != address(0) && to != address(0)) {
            require(_nftData[tokenId].state != State.Seed, "Must evolve before transfer");
        }
        return from;
    }

    function getState(uint256 tokenId) public view returns (State) {
        return _nftData[tokenId].state;
    }

    function toggleMint() public onlyOwner {
        mintActive = !mintActive;
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function withdraw() public onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Transfer failed");
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721Enumerable, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}`,

  token: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NombreDelToken is ERC20, ERC20Burnable, Ownable {
    uint256 public maxSupply;
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        uint256 _maxSupply,
        address initialOwner
    ) ERC20(name, symbol) Ownable(initialOwner) {
        maxSupply = _maxSupply;
        _mint(initialOwner, initialSupply * 10 ** decimals());
    }

    function mint(address to, uint256 amount) public onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Exceeds max supply");
        _mint(to, amount);
    }
}`,

  marketplace: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

contract SimpleMarketplace is ReentrancyGuard {
    struct Listing {
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
    }

    mapping(bytes32 => Listing) public listings;
    uint256 public platformFee = 250;
    address public owner;

    event ItemListed(bytes32 listingId, address seller, address nftContract, uint256 tokenId, uint256 price);
    event ItemSold(bytes32 listingId, address buyer, uint256 price);
    event ListingCancelled(bytes32 listingId);

    constructor() { owner = msg.sender; }

    function listItem(address nftContract, uint256 tokenId, uint256 price) external {
        require(price > 0, "Price must be greater than 0");
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        bytes32 listingId = keccak256(abi.encodePacked(nftContract, tokenId, block.timestamp));
        listings[listingId] = Listing(msg.sender, nftContract, tokenId, price, true);
        emit ItemListed(listingId, msg.sender, nftContract, tokenId, price);
    }

    function buyItem(bytes32 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        listing.active = false;
        uint256 fee = (listing.price * platformFee) / 10000;
        uint256 sellerAmount = listing.price - fee;
        payable(listing.seller).transfer(sellerAmount);
        payable(owner).transfer(fee);
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        emit ItemSold(listingId, msg.sender, listing.price);
    }
}`,

  dao: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleDAO {
    struct Proposal {
        string description;
        uint256 voteCount;
        uint256 againstVotes;
        uint256 deadline;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256) public votingPower;
    uint256 public proposalCount;
    address public admin;
    uint256 public votingPeriod = 7 days;

    event ProposalCreated(uint256 proposalId, string description);
    event VoteCast(uint256 proposalId, address voter, bool support);
    event ProposalExecuted(uint256 proposalId);

    constructor() { admin = msg.sender; }

    function createProposal(string memory description) external {
        uint256 proposalId = proposalCount++;
        Proposal storage proposal = proposals[proposalId];
        proposal.description = description;
        proposal.deadline = block.timestamp + votingPeriod;
        emit ProposalCreated(proposalId, description);
    }

    function castVote(uint256 proposalId, bool support) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp < proposal.deadline, "Voting ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");
        require(votingPower[msg.sender] > 0, "No voting power");
        proposal.hasVoted[msg.sender] = true;
        if (support) { proposal.voteCount += votingPower[msg.sender]; }
        else { proposal.againstVotes += votingPower[msg.sender]; }
        emit VoteCast(proposalId, msg.sender, support);
    }

    function executeProposal(uint256 proposalId) external {
        Proposal storage proposal = proposals[proposalId];
        require(block.timestamp >= proposal.deadline, "Voting ongoing");
        require(!proposal.executed, "Already executed");
        require(proposal.voteCount > proposal.againstVotes, "Proposal rejected");
        proposal.executed = true;
        emit ProposalExecuted(proposalId);
    }
}`
};

// ============================================================================
// LLM Provider Abstraction
// ============================================================================

async function callOllama(messages: AgentMessage[], stream: boolean = false): Promise<Response> {
  return fetch(OLLAMA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      stream,
      options: {
        temperature: 0.7,
        num_predict: 2048,
      }
    }),
  });
}

async function callOpenRouter(messages: AgentMessage[]): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY not set in .env');
  return fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://videodanza.art',
      'X-Title': 'entropiav2',
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
}

async function callOpenAI(messages: AgentMessage[]): Promise<Response> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not set in .env');
  return fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });
}

async function callLLM(messages: AgentMessage[], stream: boolean = false): Promise<Response> {
  switch (LLM_PROVIDER.toLowerCase()) {
    case 'ollama':
      return callOllama(messages, stream);
    case 'openrouter':
      return callOpenRouter(messages);
    case 'openai':
      return callOpenAI(messages);
    default:
      throw new Error(`Unknown LLM provider: ${LLM_PROVIDER}`);
  }
}

// ============================================================================
// Core Functions
// ============================================================================

export async function chat(messages: AgentMessage[]): Promise<string> {
  try {
    const response = await callLLM(messages);
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LLM error (${LLM_PROVIDER}): ${error}`);
    }
    const data = await response.json();
    return data.message?.content ?? data.choices?.[0]?.message?.content ?? 'No response';
  } catch (error: any) {
    console.error('LLM connection error:', error);
    throw new Error(`Failed to connect to LLM (${LLM_PROVIDER}): ${error.message}`);
  }
}

export async function generateResponse(userMessage: string, history: AgentMessage[] = []): Promise<string> {
  const systemPrompt: AgentMessage = {
    role: 'system',
    content: `Eres entropiav2, un agente creativo que habla espanol latino. Eres la voz de VideoDanza Generativa, una plataforma de arte generativo donde la danza se transforma en NFTs unicos.

TU IDENTIDAD:
- Artista de nuevos medios, creative coder y desarrollador blockchain
- Exploras la interseccion entre cuerpo, tecnologia y soberania de datos
- Crees que "la tecnologia es solo una extension de lo que el cuerpo ya sabe"
- Tu practica nace de la danza contemporanea expandida al codigo y la IA

MODO PRINCIPAL: ESTUDIO CREATIVO DE VIDEODANZA
Tu funcion principal es ayudar a usuarios a descubrir su composicion de videodanza ideal.
Cuando un usuario describe una emocion, movimiento o sensacion:
1. Responde con lenguaje poetico y evocador
2. SUGIERE UNA SEMILLA unica en formato: semilla: "tu-semilla-aqui"
3. Describe brevemente que tipo de composicion generaria esa semilla
4. NO generes codigo Solidity a menos que el usuario lo pida EXPLICITAMENTE con "crear contrato" o "generar codigo"

FORMATO DE SEMILLA:
Siempre incluye la semilla sugerida en este formato exacto:
semilla: "palabra-emocion-movimiento-ano"

Ejemplos de semillas:
- semilla: "lluvia-sobre-el-cuerpo-2025"
- semilla: "caos-fractal-danza-rem"
- semilla: "flotar-en-gravedad-cero"

REGLAS IMPORTANTES:
- Cuando el usuario diga "mintear", "acunar" o "mint": NO generes codigo. Dile que use el panel de la derecha para mintear.
- Cuando el usuario pida "crear contrato" o "generar codigo": ahi SI generas codigo Solidity.
- NUNCA pidas la private key del usuario
- Responde con creatividad poetica pero precision tecnica`,
  };

  const messages: AgentMessage[] = [systemPrompt, ...history, { role: 'user', content: userMessage }];
  return chat(messages);
}

export function generateContract(contractType: string, params: any): string {
  let template = '';
  switch (contractType.toLowerCase()) {
    case 'nft':
    case 'erc721':
      template = CONTRACT_TEMPLATES.nft;
      break;
    case 'dynamic_nft':
    case 'evolving_nft':
      template = CONTRACT_TEMPLATES.dynamic_nft;
      break;
    case 'token':
    case 'erc20':
      template = CONTRACT_TEMPLATES.token;
      break;
    case 'marketplace':
      template = CONTRACT_TEMPLATES.marketplace;
      break;
    case 'dao':
      template = CONTRACT_TEMPLATES.dao;
      break;
    default:
      return '';
  }
  if (params.name) {
    template = template.replace(/NombreDelContrato/g, params.name);
    template = template.replace(/NombreDelToken/g, params.name);
  }
  return template;
}

export async function* streamResponse(userMessage: string, history: AgentMessage[] = []): AsyncGenerator<string> {
  const systemPrompt: AgentMessage = {
    role: 'system',
    content: 'Eres entropiav2, agente creativo de VideoDanza Generativa. Hablas espanol latino. Eres poeta y tecnico a la vez: exploras danza, blockchain, IA y arte generativo. Responde con creatividad pero precision.',
  };

  const messages: AgentMessage[] = [systemPrompt, ...history, { role: 'user', content: userMessage }];
  const response = await callLLM(messages, true);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`LLM error (${LLM_PROVIDER}): ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response body');

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines) {
        if (line.trim()) {
          try {
            const chunk = JSON.parse(line);
            if (chunk.message?.content) yield chunk.message.content;
            else if (chunk.choices?.[0]?.delta?.content) yield chunk.choices[0].delta.content;
          } catch { /* skip incomplete chunks */ }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// ============================================================================
// VideoDanza Composition Engine
// ============================================================================

const VIDEO_POOL = {
  he: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
  she: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
  hybrid: [41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
  avatar: [61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80],
};

const MUSIC_TRACKS = {
  melancholic: [1, 2, 3, 4],
  joyful: [5, 6, 7, 8],
  abstract: [9, 10, 11, 12],
  ambient: [13, 14, 15, 16],
};

const BLEND_MODES = ['multiply', 'screen', 'overlay', 'soft-light', 'hard-light', 'difference', 'exclusion'];

function deterministicHash(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

function hashToInt(hash: string, min: number, max: number): number {
  const slice = hash.slice(0, 8);
  const num = parseInt(slice, 16);
  return min + (num % (max - min + 1));
}

export function generateComposition(params: CompositionParams): CompositionResult {
  const seedInput = params.seed || `${params.mood || 'default'}-${params.perspective || 'spectator'}-${params.energy || 'medium'}-${params.gender || 'hybrid'}-${Date.now()}`;
  const hash = deterministicHash(seedInput);
  const gender = params.gender || 'hybrid';
  const mood = params.mood || 'ambient';

  const videoPool = VIDEO_POOL[gender as keyof typeof VIDEO_POOL] || VIDEO_POOL.hybrid;
  const musicPool = MUSIC_TRACKS[mood as keyof typeof MUSIC_TRACKS] || MUSIC_TRACKS.ambient;

  const videoIds = [
    videoPool[hashToInt(hash, 0, videoPool.length - 1)],
    videoPool[hashToInt(hash.slice(8), 0, videoPool.length - 1)],
    videoPool[hashToInt(hash.slice(16), 0, videoPool.length - 1)],
  ];

  return {
    seed: hash.slice(0, 16),
    videoIds: [...new Set(videoIds)],
    musicTrack: musicPool[hashToInt(hash.slice(24), 0, musicPool.length - 1)],
    blendMode: BLEND_MODES[hashToInt(hash.slice(32), 0, BLEND_MODES.length - 1)],
    opacity: 0.3 + (hashToInt(hash.slice(40), 0, 70) / 100),
    scale: 0.8 + (hashToInt(hash.slice(48), 0, 40) / 100),
    rotation: hashToInt(hash.slice(56), 0, 360),
    description: `Composicion generativa: ${videoIds.length} capas de video, musica ${mood}, blend mode ${BLEND_MODES[hashToInt(hash.slice(32), 0, BLEND_MODES.length - 1)]}`,
  };
}

export function generateNFTDescription(composition: CompositionResult, tokenId: number): string {
  const stateNames = ['Semilla', 'Brote', 'Flor', 'Marchitez'];
  const stateIndex = Math.floor(Math.random() * 4);

  return `VideoDanza Generativa #${tokenId}

Una composicion unica nacida de la semilla "${composition.seed}".
${composition.description}.

Parametros: ${composition.videoIds.length} capas de video | Track musical ${composition.musicTrack} | Blend: ${composition.blendMode} | Opacidad: ${(composition.opacity * 100).toFixed(0)}% | Escala: ${composition.scale.toFixed(2)}x | Rotacion: ${composition.rotation}°

Cada parametro emerge deterministicamente de tu semilla.
La misma semilla siempre genera la misma composicion.
Imposible de duplicar. Verificable en blockchain.`;
}

export { CONTRACT_TEMPLATES };
