/**
 * Pinata Service - Express API Integration
 * 
 * Endpoints para acceder a videos IPFS sin rate limiting
 */

const express = require("express");
const router = express.Router();
const PinataService = require("../services/pinataService");

let pinataService;

try {
  pinataService = new PinataService();
} catch (error) {
  console.error("Error initializing PinataService:", error.message);
}

/**
 * GET /api/ipfs/videos
 * Lista todos los videos disponibles
 */
router.get("/videos", (req, res) => {
  try {
    if (!pinataService) {
      return res
        .status(503)
        .json({ error: "Pinata service not initialized" });
    }
    const videos = pinataService.listVideos();
    res.json({ success: true, videos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ipfs/video/:videoName
 * Obtiene información de un video específico
 */
router.get("/video/:videoName", (req, res) => {
  try {
    if (!pinataService) {
      return res
        .status(503)
        .json({ error: "Pinata service not initialized" });
    }
    const videoInfo = pinataService.getVideoInfo(req.params.videoName);
    res.json({ success: true, video: videoInfo });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/ipfs/cid/:videoName
 * Obtiene solo el CID de un video
 */
router.get("/cid/:videoName", (req, res) => {
  try {
    if (!pinataService) {
      return res
        .status(503)
        .json({ error: "Pinata service not initialized" });
    }
    const cid = pinataService.getVideoCID(req.params.videoName);
    res.json({ success: true, cid, ipfs: `ipfs://${cid}` });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/ipfs/gateway-url/:videoName
 * Obtiene la URL del gateway de un video
 */
router.get("/gateway-url/:videoName", (req, res) => {
  try {
    if (!pinataService) {
      return res
        .status(503)
        .json({ error: "Pinata service not initialized" });
    }
    const url = pinataService.getVideoUrl(req.params.videoName);
    res.json({ success: true, url });
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

/**
 * GET /api/ipfs/lookup-table
 * Obtiene la tabla de lookup completa
 */
router.get("/lookup-table", (req, res) => {
  try {
    if (!pinataService) {
      return res
        .status(503)
        .json({ error: "Pinata service not initialized" });
    }
    const table = pinataService.getLookupTable();
    res.json({ success: true, table });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
