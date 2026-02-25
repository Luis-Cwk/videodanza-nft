#!/usr/bin/env node

/**
 * Test Pinata Gateway Access
 * Verifica que todos los videos sean accesibles via Pinata Gateway
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

function httpRequest(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { timeout: 5000 }, (res) => {
        const { statusCode, headers } = res;
        resolve({
          statusCode,
          contentType: headers["content-type"],
          contentLength: headers["content-length"],
          accessible: statusCode === 200,
        });
      })
      .on("error", reject)
      .on("timeout", function () {
        this.destroy();
        reject(new Error("Timeout"));
      });
  });
}

async function testGatewayAccess() {
  console.log("🧪 Probando acceso a Pinata Gateway\n");
  console.log("=" + "=".repeat(59));

  const lookupPath = path.join(__dirname, "../data/ipfs_lookup_table.json");
  const lookupData = JSON.parse(fs.readFileSync(lookupPath, "utf-8"));

  let successCount = 0;
  let failCount = 0;

  for (const [videoName, videoInfo] of Object.entries(lookupData.videos)) {
    try {
      console.log(`\n🔗 Probando: ${videoName}`);
      console.log(`   CID: ${videoInfo.cid}`);
      console.log(`   Gateway: ${videoInfo.gateway}`);

      const result = await httpRequest(videoInfo.gateway);

      if (result.accessible) {
        console.log(`   ✅ Accesible (HTTP ${result.statusCode})`);
        console.log(`   📊 Tamaño: ${result.contentLength} bytes`);
        successCount++;
      } else {
        console.log(
          `   ❌ No accesible (HTTP ${result.statusCode})`
        );
        failCount++;
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 RESULTADOS");
  console.log("=".repeat(60));
  console.log(`✅ Accesibles: ${successCount}/${Object.keys(lookupData.videos).length}`);
  console.log(`❌ No accesibles: ${failCount}/${Object.keys(lookupData.videos).length}`);

  if (failCount === 0) {
    console.log("\n🎉 ¡Todos los videos son accesibles via Pinata Gateway!");
  }
}

testGatewayAccess().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
