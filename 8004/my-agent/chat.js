#!/usr/bin/env node
/**
 * Simple chat client for entropiav2 - Smart Contract Assistant
 * Run with: node chat.js
 */

const AGENT_URL = 'http://localhost:3000/a2a';

async function sendMessage(message) {
  try {
    const response = await fetch(AGENT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'message/send',
        params: {
          message: {
            role: 'user',
            parts: [{ type: 'text', text: message }]
          }
        },
        id: Date.now()
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.log('❌ Error:', data.error.message);
      return null;
    }

    // Extract agent response
    const agentMessage = data.result?.messages?.find(m => m.role === 'agent');
    if (agentMessage && agentMessage.parts && agentMessage.parts[0]) {
      return agentMessage.parts[0].text;
    }
    
    return 'No response from agent';
  } catch (error) {
    console.log('❌ Error connecting to agent:', error.message);
    return null;
  }
}

async function chat() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║         🤖 Entropiav2 - Asistente de Contratos         ║');
  console.log('║              Inteligentes & Blockchain                 ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('💡 Puedo ayudarte con:');
  console.log('   • Crear contratos NFT (ERC-721)');
  console.log('   • Crear tokens (ERC-20)');
  console.log('   • Crear marketplaces');
  console.log('   • Crear DAOs');
  console.log('   • Explicar conceptos de Web3');
  console.log('');
  console.log('📝 Ejemplos:');
  console.log('   "Crea un contrato NFT para mi arte"');
  console.log('   "Quiero hacer un token para mi comunidad"');
  console.log('   "Explícame qué es un smart contract"');
  console.log('');
  console.log('Escribe tu mensaje (o "salir" para terminar):\n');
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = () => {
    readline.question('👤 Tú: ', async (message) => {
      if (message.toLowerCase() === 'salir' || message.toLowerCase() === 'exit') {
        console.log('');
        console.log('👋 ¡Hasta luego! Recuerda:');
        console.log('   • Revisa siempre el código antes de desplegar');
        console.log('   • Usa Sepolia para pruebas');
        console.log('   • Consulta GUIA-CONTRATOS.md para más ayuda');
        console.log('');
        readline.close();
        process.exit(0);
      }

      if (message.toLowerCase() === 'ayuda' || message.toLowerCase() === 'help') {
        console.log('');
        console.log('📚 Comandos disponibles:');
        console.log('   • Pide un contrato: "Crea un NFT", "Haz un token", etc.');
        console.log('   • Pregunta conceptos: "¿Qué es blockchain?"');
        console.log('   • Salir: "salir" o "exit"');
        console.log('   • Ayuda: "ayuda" o "help"');
        console.log('');
        askQuestion();
        return;
      }

      process.stdout.write('\n🤖 Entropiav2 está pensando...\n\n');
      
      const startTime = Date.now();
      const response = await sendMessage(message);
      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      
      if (response) {
        console.log(response);
        console.log(`\n⏱️  Tiempo de respuesta: ${duration}s`);
      } else {
        console.log('❌ No pude conectar con el agente.');
        console.log('   Verifica que:');
        console.log('   1. Ollama está corriendo (ollama serve)');
        console.log('   2. El servidor A2A está activo (npm run start:a2a)');
      }
      
      console.log('\n' + '─'.repeat(60) + '\n');
      askQuestion();
    });
  };

  askQuestion();
}

chat();
