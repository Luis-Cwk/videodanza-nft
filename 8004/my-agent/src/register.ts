/**
 * ERC-8004 Agent Registration Script
 * 
 * Uses the Agent0 SDK (https://sdk.ag0.xyz/) for registration.
 * The SDK handles:
 * - Two-step registration flow (mint → upload → setAgentURI)
 * - IPFS uploads via Pinata
 * - Proper metadata format with registrations array
 * 
 * Requirements:
 * - PRIVATE_KEY in .env (wallet with testnet ETH for gas)
 * - PINATA_JWT in .env (for IPFS uploads)
 * - RPC_URL in .env (optional, defaults to public endpoint)
 * 
 * Run with: npm run register
 */

import 'dotenv/config';
import { SDK } from 'agent0-sdk';

// ============================================================================
// Agent Configuration
// ============================================================================

const AGENT_CONFIG = {
  name: 'entropiav2',
  description: 'Agente creativo de VideoDanza Generativa. Especializado en blockchain, arte generativo, danza contemporanea expandida y contratos inteligentes. Habla espanol latino. Creado por Petra (Luis Betancourt).',
  image: 'https://x.com/LuisBetx9/photo',
  // Placeholder endpoints - se actualizan al deploy en Vercel
  a2aEndpoint: process.env.A2A_ENDPOINT || 'https://entropiav2.vercel.app/.well-known/agent-card.json',
  mcpEndpoint: process.env.MCP_ENDPOINT || 'https://entropiav2.vercel.app/mcp',
};

// ============================================================================
// Main Registration Flow
// ============================================================================

async function main() {
  // Validate environment
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('PRIVATE_KEY not set in .env');
  }

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) {
    throw new Error('PINATA_JWT not set in .env');
  }

  const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

  // Initialize SDK
  console.log('🔧 Initializing Agent0 SDK...');
  const sdk = new SDK({
    chainId: 11155111,
    rpcUrl,
    signer: privateKey,
    ipfs: 'pinata',
    pinataJwt,
  });

  // Create agent
  console.log('📝 Creating agent...');
  const agent = sdk.createAgent(
    AGENT_CONFIG.name,
    AGENT_CONFIG.description,
    AGENT_CONFIG.image
  );

  // Configure endpoints
  console.log('🔗 Setting A2A endpoint...');
  await agent.setA2A(AGENT_CONFIG.a2aEndpoint);
  console.log('🔗 Setting MCP endpoint...');
  await agent.setMCP(AGENT_CONFIG.mcpEndpoint);

  // Configure trust models
  console.log('🔐 Setting trust models...');
  agent.setTrust(true, true, true);

  // Set status flags
  // Agent is now active and will appear in explorer listings
  agent.setActive(true);
  agent.setX402Support(false);

  // Add OASF skills and domains for discoverability
  // Taxonomy: https://github.com/agntcy/oasf
  console.log('🎯 Adding OASF skills...');
  agent.addSkill('creative_arts/visual_arts/generative_art');
  agent.addSkill('creative_arts/performing_arts/dance');
  agent.addSkill('technology/software_engineering/blockchain/smart_contracts');
  agent.addSkill('technology/artificial_intelligence/natural_language_processing');

  console.log('🌍 Adding OASF domains...');
  agent.addDomain('arts_and_entertainment/visual_arts');
  agent.addDomain('arts_and_entertainment/performing_arts');
  agent.addDomain('technology/software_engineering');
  agent.addDomain('technology/artificial_intelligence');

  // Register on-chain with IPFS
  console.log('⛓️  Registering agent on Ethereum Sepolia...');
  console.log('   This will:');
  console.log('   1. Mint agent NFT on-chain');
  console.log('   2. Upload metadata to IPFS');
  console.log('   3. Set agent URI on-chain');
  console.log('');

  const result = await agent.registerIPFS() as any;

  // Output results
  console.log('');
  console.log('✅ Agent registered successfully!');
  console.log('');
  console.log('🆔 Agent ID:', result.agentId);
  console.log('📄 Agent URI:', result.agentURI);
  console.log('');
   console.log('🌐 View your agent on 8004scan:');
   const agentIdNum = result.agentId?.split(':')[1] || result.agentId;
   console.log(`   https://www.8004scan.io/agents/sepolia/${agentIdNum}`);
  console.log('');
  console.log('📋 Next steps:');
  console.log('   1. Update AGENT_CONFIG endpoints with your production URLs');
  console.log('   2. Run `npm run start:a2a` to start your A2A server');
  console.log('   3. Deploy your agent to a public URL');
}

main().catch((error) => {
  console.error('❌ Registration failed:', error.message || error);
  process.exit(1);
});
