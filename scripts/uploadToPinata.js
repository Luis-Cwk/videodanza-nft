#!/usr/bin/env node

/**
 * Pinata Video Upload Script
 * Carga los videos a IPFS via Pinata y crea una tabla de lookup
 * 
 * Uso: node scripts/uploadToPinata.js
 */

const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const https = require("https");
require("dotenv").config({ path: ".env.local" });

// Configuración de Pinata
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_GATEWAY = process.env.PINATA_GATEWAY_URL || "https://gateway.pinata.cloud";

// Validar credenciales
if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  console.error("❌ Error: PINATA_API_KEY y PINATA_API_SECRET no están configuradas");
  console.error("   Asegúrate de que .env.local tiene las credenciales de Pinata");
  process.exit(1);
}

// Videos a subir
const VIDEOS_DIR = path.join(__dirname, "../videos");
const videos = [
  "20260123_181721-clone_with_audio.mp4",
  "20260123_182751-clone_with_audio.mp4",
  "20260123_182827-ascii_with_audio.mp4",
  "petra9_trails.mp4",
  "video_local_horizontal_20260213_122733_procesado_final_hibrido.mp4",
];

/**
 * Promesa wrapper para HTTPS
 */
function httpsRequest(options, form) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        } else {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        }
      });
    });

    req.on("error", reject);
    form.pipe(req);
  });
}

/**
 * Sube un archivo a Pinata
 */
async function uploadToPinata(filePath, fileName) {
  try {
    console.log(`\n⏳ Subiendo ${fileName}...`);
    
    const fileStream = fs.createReadStream(filePath);
    const form = new FormData();
    form.append("file", fileStream);

    // Metadata
    const metadata = {
      name: fileName,
      keyvalues: {
        videodanza: "true",
        type: "generative-dance-video",
        timestamp: new Date().toISOString(),
      },
    };
    form.append("pinataMetadata", JSON.stringify(metadata));

    // Opciones de pinning
    const options = {
      cidVersion: 1,
    };
    form.append("pinataOptions", JSON.stringify(options));

    // Headers con autenticación
    const requestOptions = {
      method: "POST",
      hostname: "api.pinata.cloud",
      path: "/pinning/pinFileToIPFS",
      headers: {
        "pinata_api_key": PINATA_API_KEY,
        "pinata_secret_api_key": PINATA_API_SECRET,
        ...form.getHeaders(),
      },
    };

    // Request a Pinata
    const data = await httpsRequest(requestOptions, form);
    const cid = data.IpfsHash;
    const fileSize = fs.statSync(filePath).size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);

    console.log(`✅ Subido exitosamente`);
    console.log(`   CID: ${cid}`);
    console.log(`   Tamaño: ${fileSizeMB} MB`);
    console.log(`   URL: ${PINATA_GATEWAY}/ipfs/${cid}`);

    return {
      fileName,
      filePath,
      cid,
      fileSize,
      uploadTime: new Date().toISOString(),
      gateway: `${PINATA_GATEWAY}/ipfs/${cid}`,
    };
  } catch (error) {
    console.error(`❌ Error subiendo ${fileName}:`, error.message);
    throw error;
  }
}

/**
 * Main - Sube todos los videos
 */
async function main() {
  console.log("🚀 Iniciando carga de videos a IPFS via Pinata\n");
  console.log("=" + "=".repeat(59));

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const video of videos) {
    const filePath = path.join(VIDEOS_DIR, video);

    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado: ${video}`);
      failCount++;
      continue;
    }

    try {
      const result = await uploadToPinata(filePath, video);
      results.push(result);
      successCount++;
    } catch (error) {
      failCount++;
    }
  }

  // Crear tabla de lookup
  console.log("\n" + "=".repeat(60));
  console.log("📋 Creando tabla de lookup IPFS\n");

  const lookupTable = {
    network: "sepolia",
    chainId: 11155111,
    contractAddress: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS,
    timestamp: new Date().toISOString(),
    gateway: PINATA_GATEWAY,
    videos: results.reduce((acc, video) => {
      acc[video.fileName] = {
        cid: video.cid,
        ipfs: `ipfs://${video.cid}`,
        gateway: video.gateway,
        fileSize: video.fileSize,
        uploadTime: video.uploadTime,
      };
      return acc;
    }, {}),
  };

  // Guardar tabla de lookup
  const lookupPath = path.join(__dirname, "../data/ipfs_lookup_table.json");
  const lookupDir = path.dirname(lookupPath);

  if (!fs.existsSync(lookupDir)) {
    fs.mkdirSync(lookupDir, { recursive: true });
  }

  fs.writeFileSync(lookupPath, JSON.stringify(lookupTable, null, 2));
  console.log(`✅ Tabla de lookup guardada en: ${lookupPath}`);

  // Resumen
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DE CARGA");
  console.log("=".repeat(60));
  console.log(`✅ Exitosas: ${successCount}/${videos.length}`);
  console.log(`❌ Fallidas: ${failCount}/${videos.length}`);
  console.log("\n📋 Tabla de Lookup:");
  console.log(JSON.stringify(lookupTable, null, 2));

  console.log("\n" + "=".repeat(60));
  console.log("🎉 CARGA COMPLETADA");
  console.log("=".repeat(60));
  console.log(`\nPróximo paso: Integrar servicio de Pinata en backend`);

  // Retornar tabla para tests
  return lookupTable;
}

// Ejecutar
main().catch((error) => {
  console.error("❌ Error fatal:", error);
  process.exit(1);
});

module.exports = main;
