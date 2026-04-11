export const runtime = 'edge'

const AGENT_BASE = process.env.NEXT_PUBLIC_AGENT_URL || 'https://my-agent-tau.vercel.app'
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || '2387'
const OWNER = '0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa'
const IDENTITY = '0x8004A818BFB912233c491871b3d84c89A494BD9e'

export async function GET() {
  const body = {
    project: 'videodanza-nft',
    network: 'sepolia',
    studioUrl: '/agent',
    agent: {
      name: 'entropiav2',
      id: AGENT_ID,
      owner: OWNER,
      identityContract: IDENTITY,
      card: `${AGENT_BASE}/.well-known/agent-card.json`,
      a2a: `${AGENT_BASE}/a2a`,
      mcp: `${AGENT_BASE}/mcp`,
      scan: `https://www.8004scan.io/agents/sepolia/${AGENT_ID}`,
    },
  }

  return new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
