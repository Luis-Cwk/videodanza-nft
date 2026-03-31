# 🤖 Entropiav2 - Asistente de Contratos Inteligentes

Tu agente ahora puede generar código Solidity seguro para contratos inteligentes.

## 🚀 Cómo iniciar el agente

Abre **3 terminales de PowerShell**:

### Terminal 1 - Ollama (IA):
```powershell
$env:OLLAMA_HOST="0.0.0.0:11434"
ollama serve
```

### Terminal 2 - Servidor A2A:
```powershell
cd C:\Users\petra\Documents\8004\my-agent
npm run start:a2a
```

### Terminal 3 - Chat interactivo:
```powershell
cd C:\Users\petra\Documents\8004\my-agent
node chat.js
```

---

## 💡 Qué puede hacer tu agente

### 1. Generar Contratos NFT (ERC-721)
**Ejemplos de prompts:**
- "Crea un contrato NFT para mi colección de arte digital"
- "Necesito un smart contract para mintear NFTs"
- "Quiero hacer una colección NFT con máximo 1000 piezas"

**El agente generará:**
- Código Solidity completo usando OpenZeppelin
- Explicación de cada función
- Instrucciones para desplegar en Remix IDE
- Costos de gas aproximados

### 2. Generar Tokens (ERC-20)
**Ejemplos de prompts:**
- "Crea un token para mi comunidad"
- "Quiero hacer una criptomoneda con supply limitado"
- "Necesito un contrato ERC20"

### 3. Generar Marketplaces
**Ejemplos:**
- "Crea un marketplace para comprar y vender NFTs"
- "Quiero un contrato para subastar arte digital"

### 4. Generar DAOs
**Ejemplos:**
- "Crea una DAO para gobernar mi proyecto"
- "Necesito un contrato de votación descentralizada"

---

## 🛡️ Seguridad

✅ **Tu agente NO ejecuta transacciones automáticamente**  
✅ **Solo genera código educativo**  
✅ **Usa librerías OpenZeppelin estándar**  
✅ **Tú revisas y despliegas manualmente**

---

## 📋 Pasos para desplegar un contrato

1. **Pide el código** a tu agente
2. **Copia el código** que te da
3. **Ve a Remix IDE**: https://remix.ethereum.org
4. **Crea nuevo archivo** y pega el código
5. **Compila** (Ctrl+S)
6. **Ve a "Deploy & Run"**
7. **Selecciona "Injected Provider - MetaMask"**
8. **Conecta tu wallet** (Sepolia para pruebas)
9. **Despliega** y confirma la transacción

---

## 🎨 Personalización

El agente está configurado con personalidad creativa latina. Puedes pedirle:
- "Explícame como si fuera un poema"
- "Dame un ejemplo artístico"
- "Házmelo entender paso a paso"

---

## ⚠️ Notas importantes

- Los contratos usan **Sepolia** (testnet) para pruebas
- Nunca uses mainnet sin revisar el código con un experto
- El gas en Sepolia es gratis (faucet: https://cloud.google.com/application/web3/faucet/ethereum/sepolia)
- Guarda siempre tu código fuente

---

## 🆘 Ayuda

Si algo no funciona:
1. Verifica que Ollama esté corriendo
2. Verifica que el servidor A2A esté en puerto 3000
3. Revisa que no haya errores en las terminales

¡Diviértete creando! 🚀✨
