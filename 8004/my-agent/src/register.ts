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
  image: 'https://my-agent-tau.vercel.app/logo.svg',
  // Endpoints can be set explicitly or derived from AGENT_BASE_URL
  a2aEndpoint: process.env.A2A_ENDPOINT || '',
  mcpEndpoint: process.env.MCP_ENDPOINT || '',
};

const EXISTING_AGENT_ID = process.env.AGENT_ID || '11155111:2387';

function resolveEndpoints() {
  const base = process.env.AGENT_BASE_URL || 'https://my-agent-tau.vercel.app';
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;

  return {
    // A2A discovery should point to the agent card URL
    a2a: AGENT_CONFIG.a2aEndpoint || `${normalizedBase}/.well-known/agent-card.json`,
    mcp: AGENT_CONFIG.mcpEndpoint || `${normalizedBase}/mcp`,
  };
}

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

  // Load existing agent when AGENT_ID is configured; otherwise create a new one
  let agent: any;
  if (EXISTING_AGENT_ID) {
    console.log(`📝 Loading existing agent (${EXISTING_AGENT_ID})...`);
    try {
      agent = await sdk.loadAgent(EXISTING_AGENT_ID);
      agent.updateInfo(AGENT_CONFIG.name, AGENT_CONFIG.description, AGENT_CONFIG.image);
    } catch (error) {
      console.log('⚠️  Could not load existing agent, creating a new one.');
      agent = sdk.createAgent(
        AGENT_CONFIG.name,
        AGENT_CONFIG.description,
        AGENT_CONFIG.image
      );
    }
  } else {
    console.log('📝 Creating agent...');
    agent = sdk.createAgent(
      AGENT_CONFIG.name,
      AGENT_CONFIG.description,
      AGENT_CONFIG.image
    );
  }

  // Configure endpoints
  const endpoints = resolveEndpoints();
  console.log('🔗 Setting A2A endpoint:', endpoints.a2a);
  await agent.setA2A(endpoints.a2a);
  console.log('🔗 Setting MCP endpoint:', endpoints.mcp);
  await agent.setMCP(endpoints.mcp);

  // Configure trust models
  console.log('🔐 Setting trust models...');
  agent.setTrust(true, true, true);

  // Set status flags
  // Agent is now active and will appear in explorer listings
  agent.setActive(true);
  agent.setX402Support(false);

  // Remove stale OASF service when no skills/domains are declared
  // (avoids IA025: OASF service has neither skills nor domains)
  agent.removeEndpoint('OASF');

  // Register on-chain with IPFS
  console.log('⛓️  Registering agent on Ethereum Sepolia...');
  console.log('   This will:');
  console.log('   1. Mint agent NFT on-chain');
  console.log('   2. Upload metadata to IPFS');
  console.log('   3. Set agent URI on-chain');
  console.log('');

  const tx = await agent.registerIPFS() as any;
  const mined = await tx.waitMined({ confirmations: 1 });
  const result = mined?.result ?? {};
  const txHash = tx?.hash || mined?.receipt?.transactionHash;

  const agentIdRaw =
    result?.agentId ??
    result?.agentID ??
    result?.id ??
    result?.tokenId ??
    result?.registration?.agentId ??
    result?.registerResult?.agentId;
  const agentUriRaw =
    result?.agentURI ??
    result?.agentUri ??
    result?.uri ??
    result?.registration?.agentURI ??
    result?.registerResult?.agentURI;

  const printableAgentId =
    typeof agentIdRaw === 'bigint' ? agentIdRaw.toString() : String(agentIdRaw ?? 'N/A');

  const agentIdNum = printableAgentId.includes(':')
    ? printableAgentId.split(':')[1]
    : printableAgentId;

  // Output results
  console.log('');
  console.log('✅ Agent registered successfully!');
  console.log('');
  console.log('🆔 Agent ID:', printableAgentId);
  console.log('📄 Agent URI:', agentUriRaw ?? 'N/A');
  if (txHash) {
    console.log('🧾 Tx Hash:', txHash);
  }
  if (agentIdRaw == null) {
    console.log('ℹ️  Debug payload:');
    console.log(JSON.stringify(result, null, 2));
  }
  console.log('');
  console.log('🌐 View your agent on 8004scan:');
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
