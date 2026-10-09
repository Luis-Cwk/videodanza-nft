import { createPublicClient, http, parseAbiItem, type Address } from 'viem'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0

const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828') as Address
const SEPOLIA_RPC = process.env.SEPOLIA_RPC || 'https://ethereum-sepolia.publicnode.com'
const AGENT_ID = process.env.NEXT_PUBLIC_AGENT_ID || '2387'
const AGENT_OWNER = '0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa'
const AGENT_IDENTITY_CONTRACT = '0x8004A818BFB912233c491871b3d84c89A494BD9e'
const AGENT_REPUTATION_CONTRACT = '0x8004B663056A597Dffe9eCcC1965A193B7388713' as Address

// Nota (8 oct 2026): esta ruta usaba ethers v6. En el bundle serverless de
// Next.js, ethers v6 revienta al decodificar resultados con
// "TypeError: Cannot assign to read only property '0'" (Result congelados).
// Por eso se reescribio con viem, que ya es dependencia directa del frontend
// y devuelve objetos planos. NO volver a ethers en rutas de servidor.

// Los RPC publicos (publicnode, etc.) podan historial viejo de logs:
// eth_getLogs sobre bloques antiguos responde "pruned history unavailable"
// (code 4444) o "query returned more than N results". Por eso:
// 1. Escaneamos chunk por chunk, del MAS NUEVO al mas viejo.
// 2. Cada chunk tiene su propio try/catch: un chunk podado se omite,
//    NUNCA tumba la ruta completa.
// 3. Corte temprano al juntar MAX_EVENTS eventos.
const LOOKBACK_BLOCKS = 120000n
const CHUNK_SIZE = 45000n
const MAX_EVENTS = 12

const MINTED_EVENT = parseAbiItem(
  'event Minted(uint256 indexed tokenId, address indexed to, bytes32 indexed seed, string metadataURI)'
)

const REPUTATION_ABI = [
  {
    type: 'function',
    name: 'getClients',
    stateMutability: 'view',
    inputs: [{ name: 'agentId', type: 'uint256' }],
    outputs: [{ type: 'address[]' }],
  },
  {
    type: 'function',
    name: 'getSummary',
    stateMutability: 'view',
    inputs: [
      { name: 'agentId', type: 'uint256' },
      { name: 'clientAddresses', type: 'address[]' },
      { name: 'tag1', type: 'string' },
      { name: 'tag2', type: 'string' },
    ],
    outputs: [
      { name: 'count', type: 'uint64' },
      { name: 'summaryValue', type: 'int128' },
      { name: 'summaryValueDecimals', type: 'uint8' },
    ],
  },
] as const

type MintActivity = {
  tokenId: string
  to: string
  seed: string
  txHash: string
  blockNumber: number
  timestamp: number | null
}

function isPrunedOrRangeError(err: unknown): boolean {
  const e = err as { message?: string; cause?: { message?: string } }
  const msg = `${e?.message || err} ${e?.cause?.message || ''}`.toLowerCase()
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
    const client = createPublicClient({ transport: http(SEPOLIA_RPC) })
    const numericAgentId = BigInt(AGENT_ID)

    let activity: MintActivity[] = []
    let activityError: string | null = null

    try {
      const latest = await client.getBlockNumber()
      const fromBlock = latest > LOOKBACK_BLOCKS ? latest - LOOKBACK_BLOCKS : 0n

      // Chunks del mas nuevo al mas viejo: el historial reciente nunca
      // esta podado y ahi vive la actividad que mostramos.
      const chunks: Array<[bigint, bigint]> = []
      for (let start = fromBlock; start <= latest; start += CHUNK_SIZE + 1n) {
        const end = latest < start + CHUNK_SIZE ? latest : start + CHUNK_SIZE
        chunks.push([start, end])
      }
      chunks.reverse()

      type LogItem = {
        args: { tokenId?: bigint; to?: Address; seed?: string }
        transactionHash?: string
        blockNumber?: bigint
      }
      const logs: LogItem[] = []
      let prunedChunks = 0

      for (const [start, end] of chunks) {
        if (logs.length >= MAX_EVENTS) break
        try {
          const batch = await client.getLogs({
            address: CONTRACT_ADDRESS,
            event: MINTED_EVENT,
            fromBlock: start,
            toBlock: end,
          })
          // newest-first: los mas recientes al principio
          logs.unshift(...batch.slice().reverse())
        } catch (logErr) {
          if (isPrunedOrRangeError(logErr)) {
            // Bloques podados en el RPC publico: esperable en chunks viejos.
            prunedChunks++
            continue
          }
          console.warn(`getLogs fallo en rango ${start}-${end}:`, logErr)
        }
        if (logs.length >= MAX_EVENTS) break
      }

      const recent = logs.slice(0, MAX_EVENTS)
      activity = await Promise.all(
        recent.map(async (log) => {
          try {
            const block = log.blockNumber
              ? await client.getBlock({ blockNumber: log.blockNumber })
              : null
            return {
              tokenId: (log.args.tokenId ?? 0n).toString(),
              to: log.args.to ?? '0x0',
              seed: log.args.seed ?? '0x0',
              txHash: log.transactionHash ?? '',
              blockNumber: Number(log.blockNumber ?? 0),
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
      const clients = await client.readContract({
        address: AGENT_REPUTATION_CONTRACT,
        abi: REPUTATION_ABI,
        functionName: 'getClients',
        args: [numericAgentId],
      })
      const summary = await client.readContract({
        address: AGENT_REPUTATION_CONTRACT,
        abi: REPUTATION_ABI,
        functionName: 'getSummary',
        args: [numericAgentId, clients, '', ''],
      })
      const [count, summaryValue, decimals] = summary
      const scale = 10 ** Number(decimals)
      const average = scale > 0 ? Number(summaryValue) / scale : Number(summaryValue)

      reputationData = {
        feedbackCount: Number(count),
        average,
        decimals: Number(decimals),
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
