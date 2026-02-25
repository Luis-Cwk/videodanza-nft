/**
 * Pinata IPFS Service
 * 
 * Servicio para interactuar con Pinata:
 * - Subir archivos a IPFS
 * - Recuperar CIDs
 * - Acceder a contenido via gateway
 */

const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

class PinataService {
  constructor() {
    this.apiKey = process.env.PINATA_API_KEY;
    this.apiSecret = process.env.PINATA_API_SECRET;
    this.jwt = process.env.PINATA_JWT;
    this.gateway = process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud";
    this.apiUrl = "https://api.pinata.cloud";

    if (!this.apiKey || !this.apiSecret) {
      throw new Error("Pinata API credentials not configured in .env.local");
    }
  }

  /**
   * Sube un archivo a IPFS via Pinata
   * @param {string} filePath - Ruta del archivo
   * @param {object} metadata - Metadata del archivo
   * @returns {Promise<string>} CID del archivo
   */
  async uploadFile(filePath, metadata = {}) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileStream = fs.createReadStream(filePath);
      const form = new FormData();
      form.append("file", fileStream);

      // Agregar metadata
      const pinataMetadata = {
        name: path.basename(filePath),
        keyvalues: {
          videodanza: "true",
          timestamp: new Date().toISOString(),
          ...metadata,
        },
      };
      form.append("pinataMetadata", JSON.stringify(pinataMetadata));

      // Opciones
      const pinataOptions = {
        cidVersion: 1,
      };
      form.append("pinataOptions", JSON.stringify(pinataOptions));

      // Headers
      const headers = {
        "pinata_api_key": this.apiKey,
        "pinata_secret_api_key": this.apiSecret,
        ...form.getHeaders(),
      };

      // Request
      const response = await fetch(`${this.apiUrl}/pinning/pinFileToIPFS`, {
        method: "POST",
        headers: headers,
        body: form,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Pinata API error: ${response.status} - ${error}`);
      }

      const data = await response.json();
      return data.IpfsHash;
    } catch (error) {
      console.error("Error uploading file to Pinata:", error);
      throw error;
    }
  }

  /**
   * Obtiene la URL del gateway de un CID
   * @param {string} cid - IPFS CID
   * @returns {string} URL del gateway
   */
  getGatewayUrl(cid) {
    return `${this.gateway}/ipfs/${cid}`;
  }

  /**
   * Obtiene la URL de IPFS de un CID
   * @param {string} cid - IPFS CID
   * @returns {string} URL ipfs://
   */
  getIpfsUrl(cid) {
    return `ipfs://${cid}`;
  }

  /**
   * Carga la tabla de lookup de IPFS
   * @returns {object} Tabla de lookup
   */
  loadLookupTable() {
    try {
      const lookupPath = path.join(__dirname, "../data/ipfs_lookup_table.json");
      if (!fs.existsSync(lookupPath)) {
        throw new Error("IPFS lookup table not found. Run: npm run upload:pinata");
      }
      const data = fs.readFileSync(lookupPath, "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.error("Error loading lookup table:", error);
      throw error;
    }
  }

  /**
   * Obtiene el CID de un video por nombre
   * @param {string} videoName - Nombre del video
   * @returns {string} CID del video
   */
  getVideoCID(videoName) {
    try {
      const lookupTable = this.loadLookupTable();
      const videoData = lookupTable.videos[videoName];

      if (!videoData) {
        throw new Error(`Video not found in lookup table: ${videoName}`);
      }

      return videoData.cid;
    } catch (error) {
      console.error("Error getting video CID:", error);
      throw error;
    }
  }

  /**
   * Obtiene la URL de gateway de un video
   * @param {string} videoName - Nombre del video
   * @returns {string} URL del gateway
   */
  getVideoUrl(videoName) {
    try {
      const lookupTable = this.loadLookupTable();
      const videoData = lookupTable.videos[videoName];

      if (!videoData) {
        throw new Error(`Video not found in lookup table: ${videoName}`);
      }

      return videoData.gateway;
    } catch (error) {
      console.error("Error getting video URL:", error);
      throw error;
    }
  }

  /**
   * Lista todos los videos disponibles
   * @returns {array} Array de nombres de videos
   */
  listVideos() {
    try {
      const lookupTable = this.loadLookupTable();
      return Object.keys(lookupTable.videos);
    } catch (error) {
      console.error("Error listing videos:", error);
      throw error;
    }
  }

  /**
   * Obtiene información completa de un video
   * @param {string} videoName - Nombre del video
   * @returns {object} Información del video
   */
  getVideoInfo(videoName) {
    try {
      const lookupTable = this.loadLookupTable();
      const videoData = lookupTable.videos[videoName];

      if (!videoData) {
        throw new Error(`Video not found: ${videoName}`);
      }

      return {
        name: videoName,
        ...videoData,
        gateway: this.gateway,
      };
    } catch (error) {
      console.error("Error getting video info:", error);
      throw error;
    }
  }

  /**
   * Obtiene la tabla de lookup completa
   * @returns {object} Tabla de lookup
   */
  getLookupTable() {
    return this.loadLookupTable();
  }
}

module.exports = PinataService;
