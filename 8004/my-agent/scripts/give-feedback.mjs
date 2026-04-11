import 'dotenv/config';
import { SDK } from 'agent0-sdk';

const AGENT_ID = process.env.FEEDBACK_AGENT_ID || process.env.AGENT_ID || '11155111:2387';
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
const PRIVATE_KEY = process.env.FEEDBACK_PRIVATE_KEY || process.env.PRIVATE_KEY;
const VALUE = Number(process.env.FEEDBACK_VALUE || 5);
const TAG1 = process.env.FEEDBACK_TAG1 || 'studio';
const TAG2 = process.env.FEEDBACK_TAG2 || 'videodanza';
const ENDPOINT = process.env.FEEDBACK_ENDPOINT || 'https://my-agent-tau.vercel.app/.well-known/agent-card.json';

function assertEnv() {
  if (!PRIVATE_KEY) {
    throw new Error('Set FEEDBACK_PRIVATE_KEY or PRIVATE_KEY in .env');
  }
}

async function main() {
  assertEnv();

  const message = process.env.FEEDBACK_REASON || 'Probado flujo A2A/MCP + estudio creativo. Buena experiencia general.';

  console.log('Initializing SDK...');
  const sdk = new SDK({
    chainId: 11155111,
    rpcUrl: RPC_URL,
    signer: PRIVATE_KEY,
    ipfs: 'pinata',
    pinataJwt: process.env.PINATA_JWT,
  });

  const feedbackFile = sdk.prepareFeedbackFile({
    createdAt: new Date().toISOString(),
    reasoning: message,
    context: 'Manual tester feedback from entropiav2 studio',
  });

  console.log(`Submitting feedback for ${AGENT_ID}...`);
  const tx = await sdk.giveFeedback(AGENT_ID, VALUE, TAG1, TAG2, ENDPOINT, feedbackFile);
  const mined = await tx.waitMined({ confirmations: 1 });

  console.log('Feedback submitted.');
  console.log('Tx Hash:', tx.hash || mined?.receipt?.transactionHash || 'N/A');

  const summary = await sdk.getReputationSummary(AGENT_ID);
  console.log('Updated Summary:', summary);
}

main().catch((error) => {
  console.error('Failed to give feedback:', error.message || error);
  process.exit(1);
});
