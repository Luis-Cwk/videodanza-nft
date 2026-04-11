import { ethers } from 'ethers'

export const runtime = 'nodejs'

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828'
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com'
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || '2387'
const AGENT_OWNER = '0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa'
const AGENT_IDENTITY_CONTRACT = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const AGENT_REPUTATION_CONTRACT = '0x8004B663056A597Dffe9eCcC1965A193B7388713'

const ABI = [
  'event Minted(uint256 indexed tokenId, address indexed to, bytes32 indexed seed, string metadataURI)',
]

const REPUTATION_ABI = [
  'function getClients(uint256 agentId) view returns (address[])',
  'function getSummary(uint256 agentId, address[] clientAddresses, string tag1, string tag2) view returns (uint64 count, int128 summaryValue, uint8 summaryValueDecimals)',
]

type MintActivity = {
  tokenId: string
  to: string
  seed: string
  txHash: string
  blockNumber: number
  timestamp: number | null
}

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
    const reputation = new ethers.Contract(AGENT_REPUTATION_CONTRACT, REPUTATION_ABI, provider)
    const numericAgentId = BigInt(AGENT_ID)

    const latest = await provider.getBlockNumber()
    const fromBlock = Math.max(0, latest - 120000)
    const maxRange = 45000
    const logs: any[] = []

    for (let start = fromBlock; start <= latest; start += maxRange + 1) {
      const end = Math.min(latest, start + maxRange)
      const batch = await contract.queryFilter(contract.filters.Minted(), start, end)
      logs.push(...batch)
    }

    const recent = logs.slice(-12).reverse()
    const activity: MintActivity[] = await Promise.all(
      recent.map(async (log) => {
        const block = await provider.getBlock(log.blockNumber)
        const parsed = log as unknown as {
          args: { tokenId: bigint; to: string; seed: string }
          transactionHash: string
          blockNumber: number
        }

        return {
          tokenId: parsed.args.tokenId.toString(),
          to: parsed.args.to,
          seed: parsed.args.seed,
          txHash: parsed.transactionHash,
          blockNumber: parsed.blockNumber,
          timestamp: block ? Number(block.timestamp) : null,
        }
      })
    )

    let reputationData: {
      feedbackCount: number
      average: number
      decimals: number
      clients: number
    } | null = null

    try {
      const clients: string[] = await reputation.getClients(numericAgentId)
      const summary = await reputation.getSummary(numericAgentId, clients, '', '')
      const count = Number(summary.count)
      const summaryValue = Number(summary.summaryValue)
      const decimals = Number(summary.summaryValueDecimals)
      const scale = 10 ** decimals
      const average = scale > 0 ? summaryValue / scale : summaryValue

      reputationData = {
        feedbackCount: count,
        average,
        decimals,
        clients: clients.length,
      }
    } catch {
      reputationData = null
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: Date.now(),
        agent: {
          id: AGENT_ID,
          chainId: 11155111,
          owner: AGENT_OWNER,
          identityContract: AGENT_IDENTITY_CONTRACT,
          reputationContract: AGENT_REPUTATION_CONTRACT,
        },
        links: {
          agent: `https://www.8004scan.io/agents/sepolia/${AGENT_ID}`,
          owner: `https://www.8004scan.io/address/sepolia/${AGENT_OWNER}`,
          identityContract: `https://www.8004scan.io/address/sepolia/${AGENT_IDENTITY_CONTRACT}`,
          reputationContract: `https://www.8004scan.io/address/sepolia/${AGENT_REPUTATION_CONTRACT}`,
          collection: `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
        },
        reputation: reputationData,
        activity,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'No se pudo leer actividad on-chain',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}
