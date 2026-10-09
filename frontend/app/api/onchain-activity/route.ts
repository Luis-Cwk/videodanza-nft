import { ethers } from 'ethers'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828'
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com'
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || '2387'
const AGENT_OWNER = '0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa'
const AGENT_IDENTITY_CONTRACT = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const AGENT_REPUTATION_CONTRACT = '0x8004B663056A597Dffe9eCcC1965A193B7388713'

// Los RPC publicos (publicnode, etc.) podan historial viejo de logs:
// eth_getLogs sobre bloques antiguos responde "pruned history unavailable"
// (code 4444) o "query returned more than N results". Por eso:
// 1. Escaneamos chunk por chunk, del MAS NUEVO al mas viejo.
// 2. Cada chunk tiene su propio try/catch: un chunk podado se omite,
//    NUNCA tumba la ruta completa.
// 3. Corte temprano al juntar MAX_EVENTS eventos.
const LOOKBACK_BLOCKS = 120000
const CHUNK_SIZE = 45000
const MAX_EVENTS = 12

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

function isPrunedOrRangeError(err: unknown): boolean {
  const msg = String((err as Error)?.message || err).toLowerCase()
  return (
    msg.includes('pruned') ||
    msg.includes('4444') ||
    msg.includes('more than') ||
    msg.includes('exceed') ||
    msg.includes('limit') ||
    msg.includes('range too large')
  )
}

export async function GET() {
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider)
    const reputation = new ethers.Contract(AGENT_REPUTATION_CONTRACT, REPUTATION_ABI, provider)
    const numericAgentId = BigInt(AGENT_ID)

    let activity: MintActivity[] = []
    let activityError: string | null = null

    try {
      const latest = await provider.getBlockNumber()
      const fromBlock = Math.max(0, latest - LOOKBACK_BLOCKS)

      // Chunks del mas nuevo al mas viejo: el historial reciente nunca
      // esta podado y ahi vive la actividad que mostramos.
      const chunks: Array<[number, number]> = []
      for (let start = fromBlock; start <= latest; start += CHUNK_SIZE + 1) {
        chunks.push([start, Math.min(latest, start + CHUNK_SIZE)])
      }
      chunks.reverse()

      const logs: any[] = []
      let prunedChunks = 0

      for (const [start, end] of chunks) {
        if (logs.length >= MAX_EVENTS) break
        try {
          const batch = await contract.queryFilter(contract.filters.Minted(), start, end)
          logs.unshift(...batch.reverse())
        } catch (logErr) {
          if (isPrunedOrRangeError(logErr)) {
            // Bloques podados en el RPC publico: esperable en chunks viejos.
            prunedChunks++
            continue
          }
          console.warn(`queryFilter fallo en rango ${start}-${end}:`, logErr)
        }
        if (logs.length >= MAX_EVENTS) break
      }

      const recent = logs.slice(0, MAX_EVENTS)
      activity = await Promise.all(
        recent.map(async (log) => {
          try {
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
          } catch (blockErr) {
            console.warn('Error fetching block:', blockErr)
            return {
              tokenId: '0',
              to: '0x0',
              seed: '0x0',
              txHash: '',
              blockNumber: 0,
              timestamp: null,
            }
          }
        })
      )

      if (prunedChunks > 0 && activity.length === 0) {
        activityError = `RPC publico podo ${prunedChunks} rango(s) viejo(s); sin mints recientes visibles. Configura SEPOLIA_RPC con un proveedor de archivo completo para historial extendido.`
      }
    } catch (err) {
      console.warn('Activity fetching failed (non-critical):', err)
      activityError = err instanceof Error ? err.message : 'Activity fetch failed'
    }

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
    } catch (err) {
      console.warn('Reputation fetch failed (non-critical):', err)
      reputationData = null
    }

    return new Response(
      JSON.stringify({
        ok: true,
        updatedAt: Date.now(),
        activityError,
        agent: {
          id: AGENT_ID,
          chainId: 11155111,
          owner: AGENT_OWNER,
          identityContract: AGENT_IDENTITY_CONTRACT,
          reputationContract: AGENT_REPUTATION_CONTRACT,
        },
        links: {
          agent: `https://www.8004scan.io/agents/sepolia/${AGENT_ID}`,
          owner: `https://sepolia.etherscan.io/address/${AGENT_OWNER}`,
          identityContract: `https://sepolia.etherscan.io/address/${AGENT_IDENTITY_CONTRACT}`,
          reputationContract: `https://sepolia.etherscan.io/address/${AGENT_REPUTATION_CONTRACT}`,
          collection: `https://sepolia.etherscan.io/address/${CONTRACT_ADDRESS}`,
        },
        reputation: reputationData,
        activity,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'No se pudo leer actividad on-chain',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, max-age=0',
          Pragma: 'no-cache',
          Expires: '0',
        },
      }
    )
  }
}
