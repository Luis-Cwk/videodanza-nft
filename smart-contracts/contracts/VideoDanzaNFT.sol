// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title VideoDanzaNFT
 * @dev Contrato ERC-721 para experiencias generativas de videodanza
 * 
 * Cada NFT representa una composición única de videodanza generada
 * determinísticamente a partir de un seed. El mismo seed siempre
 * genera la misma composición, permitiendo reproducibilidad y verificación.
 */
contract VideoDanzaNFT is ERC721, ERC2981, Ownable {

    // ==================== STATE VARIABLES ====================

    /// @notice Contador de tokens acuñados
    uint256 private _tokenIdCounter;

    /// @notice Mapeo de tokenId → seed generativo
    /// @dev Utilizado para reproducibilidad de composiciones
    mapping(uint256 => bytes32) public tokenIdToSeed;

    /// @notice Mapeo de seed → si ha sido acuñado
    /// @dev Previene acuñaciones duplicadas del mismo seed
    mapping(bytes32 => bool) private _seedMinted;

    /// @notice Mapeo de tokenId → metadata URI
    mapping(uint256 => string) private _tokenURIs;

    /// @notice Precio de mint en Wei (0.001 ETH = 1000000000000000 wei)
    uint256 public mintPrice = 1000000000000000;

    /// @notice Royalty fee (7.5% = 750 basis points)
    uint96 private constant ROYALTY_FEE_NUMERATOR = 750;

    // ==================== EVENTS ====================

    /// @notice Emitido cuando se acuña un nuevo NFT
    event Minted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 seed,
        string metadataURI
    );

    /// @notice Emitido cuando se actualiza la metadata
    event MetadataUpdated(uint256 indexed tokenId, string newURI);

    /// @notice Emitido cuando se actualiza el precio de mint
    event MintPriceUpdated(uint256 newPrice);

    /// @notice Emitido cuando se retiran fondos
    event Withdrawn(address indexed to, uint256 amount);

    // ==================== CONSTRUCTOR ====================

    /**
     * @notice Inicializa el contrato ERC-721
     * @param initialOwner Dirección del propietario inicial
     */
    constructor(address initialOwner)
        ERC721("VideoDanza", "VDANZA")
        Ownable(initialOwner)
    {
        // Configurar royalties por defecto (7.5%)
        _setDefaultRoyalty(initialOwner, ROYALTY_FEE_NUMERATOR);
    }

    // ==================== MAIN FUNCTIONS ====================

    /**
     * @notice Acuña un nuevo NFT VideoDanza con metadata generativa
     * @param metadataURI URI a metadata JSON en IPFS (ipfs://Qm...)
     * @param seed Seed determinístico que generó la composición
     * @return tokenId ID del token acuñado
     * 
     * Requisitos:
     * - msg.value >= mintPrice
     * - seed no ha sido acuñado antes
     * - metadataURI no está vacío
     */
    function mint(string calldata metadataURI, bytes32 seed)
        external
        payable
        returns (uint256)
    {
        // Validación 1: Pago suficiente
        require(msg.value >= mintPrice, "VideoDanzaNFT: Insufficient payment");

        // Validación 2: Seed no duplicado
        require(
            !_seedMinted[seed],
            "VideoDanzaNFT: Seed already minted"
        );

        // Validación 3: Metadata URI no vacío
        require(
            bytes(metadataURI).length > 0,
            "VideoDanzaNFT: Metadata URI required"
        );

        // Generar tokenId único
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Almacenar seed para reproducibilidad
        tokenIdToSeed[tokenId] = seed;
        _seedMinted[seed] = true;

        // Acuñar NFT
        _safeMint(msg.sender, tokenId);

        // Asignar metadata URI
        _tokenURIs[tokenId] = metadataURI;

        // Emitir evento
        emit Minted(tokenId, msg.sender, seed, metadataURI);

        return tokenId;
    }

    /**
     * @notice Obtiene el seed de un token específico
     * @param tokenId ID del token
     * @return seed El seed determinístico utilizado en generación
     * 
     * Esta función es pública para permitir verificación y reproducción
     * de la composición en cualquier momento.
     */
    function getSeed(uint256 tokenId)
        external
        view
        returns (bytes32)
    {
        require(_ownerOf(tokenId) != address(0), "VideoDanzaNFT: Token does not exist");
        return tokenIdToSeed[tokenId];
    }

    /**
     * @notice Actualiza la metadata de un token
     * @param tokenId ID del token a actualizar
     * @param newURI Nueva URI a metadata en IPFS
     * 
     * Solo el propietario del token puede llamar esta función.
     * El seed permanece inmutable.
     */
    function updateMetadata(uint256 tokenId, string calldata newURI)
        external
    {
        require(
            ownerOf(tokenId) == msg.sender,
            "VideoDanzaNFT: Not token owner"
        );
        require(
            bytes(newURI).length > 0,
            "VideoDanzaNFT: Metadata URI required"
        );

        _tokenURIs[tokenId] = newURI;

        emit MetadataUpdated(tokenId, newURI);
    }

    /**
     * @notice Actualiza el precio de mint
     * @param newPrice Nuevo precio en Wei
     * 
     * Solo el propietario del contrato puede llamar.
     */
    function updateMintPrice(uint256 newPrice)
        external
        onlyOwner
    {
        require(newPrice > 0, "VideoDanzaNFT: Price must be positive");
        mintPrice = newPrice;

        emit MintPriceUpdated(newPrice);
    }

    /**
     * @notice Retira fondos acumulados del contrato
     * 
     * Solo el propietario puede llamar.
     * Usa el patrón Pull para evitar vulnerabilidades de reentrancy.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "VideoDanzaNFT: No funds to withdraw");

        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "VideoDanzaNFT: Withdrawal failed");

        emit Withdrawn(owner(), balance);
    }

    // ==================== OVERRIDE FUNCTIONS ====================

    /**
     * @notice Retorna el token URI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override
        returns (string memory)
    {
        require(_ownerOf(tokenId) != address(0), "VideoDanzaNFT: Token does not exist");
        return _tokenURIs[tokenId];
    }

    /**
     * @notice Comprueba si el contrato soporta una interfaz
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return ERC721.supportsInterface(interfaceId) ||
               ERC2981.supportsInterface(interfaceId);
    }

    // ==================== HELPER FUNCTIONS ====================

    /**
     * @notice Retorna el total de tokens acuñados
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @notice Verifica si un seed ya ha sido acuñado
     */
    function isSeedMinted(bytes32 seed) external view returns (bool) {
        return _seedMinted[seed];
    }
}
