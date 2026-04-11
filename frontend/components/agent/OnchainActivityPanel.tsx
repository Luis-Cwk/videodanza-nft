'use client'

import { useEffect, useMemo, useState } from 'react'

type ActivityItem = {
  tokenId: string
  to: string
  seed: string
  txHash: string
  blockNumber: number
  timestamp: number | null
}

type ActivityResponse = {
  ok: boolean
  updatedAt?: number
  agent?: {
    id: string
    chainId: number
    owner: string
    identityContract: string
    reputationContract: string
  }
  links?: {
    agent: string
    owner: string
    identityContract: string
    reputationContract: string
    collection: string
  }
  reputation?: {
    feedbackCount: number
    average: number
    decimals: number
    clients: number
  } | null
  activity?: ActivityItem[]
  error?: string
}

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function shortHash(hash: string) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}

function shortSeed(seed: string) {
  return `${seed.slice(0, 14)}...${seed.slice(-8)}`
}

export function OnchainActivityPanel() {
  const [data, setData] = useState<ActivityResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/onchain-activity', { cache: 'no-store' })
      const json = await res.json()
      setData(json)
    } catch {
      setData({ ok: false, error: 'No se pudo cargar actividad on-chain' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const id = setInterval(() => {
      void load()
    }, 30000)
    return () => clearInterval(id)
  }, [])

  const lastUpdate = useMemo(() => {
    if (!data?.updatedAt) return '-'
    return new Date(data.updatedAt).toLocaleTimeString('es-MX')
  }, [data?.updatedAt])

  return (
    <section className="mt-4">
      <div className="data-panel">
        <div className="data-panel-label" data-coord="CHAIN.001">
          Actividad On-Chain y Reputacion Publica
        </div>

        <div style={{ marginTop: '1rem', display: 'grid', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <a href={data?.links?.agent} target="_blank" rel="noopener noreferrer" className="scan-link">Agente en 8004scan</a>
            <a href={data?.links?.owner} target="_blank" rel="noopener noreferrer" className="scan-link">Wallet owner</a>
            <a href={data?.links?.identityContract} target="_blank" rel="noopener noreferrer" className="scan-link">Contrato identidad</a>
            <a href={data?.links?.reputationContract} target="_blank" rel="noopener noreferrer" className="scan-link">Contrato reputacion</a>
            <a href={data?.links?.collection} target="_blank" rel="noopener noreferrer" className="scan-link">Coleccion NFT</a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '0.6rem' }}>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.6rem' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Agent ID</div>
              <div style={{ marginTop: '0.25rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>
                {data?.agent?.id || '-'}
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.6rem' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Chain</div>
              <div style={{ marginTop: '0.25rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>
                {data?.agent?.chainId ? `Sepolia (${data.agent.chainId})` : '-'}
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.6rem' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Reputacion</div>
              <div style={{ marginTop: '0.25rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>
                {typeof data?.reputation?.average === 'number' ? data.reputation.average.toFixed(2) : 'Sin feedback'}
              </div>
            </div>
            <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.6rem' }}>
              <div style={{ fontSize: '0.58rem', color: 'var(--text-muted)', letterSpacing: '1px', textTransform: 'uppercase' }}>Feedbacks</div>
              <div style={{ marginTop: '0.25rem', fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem' }}>
                {data?.reputation?.feedbackCount ?? 0} ({data?.reputation?.clients ?? 0} wallets)
              </div>
            </div>
          </div>

          <div className="telemetry" style={{ justifyContent: 'flex-start' }}>
            <span>STATUS: {loading ? 'SYNC...' : data?.ok ? 'LIVE' : 'ERROR'}</span>
            <span>│</span>
            <span>UPDATED: {lastUpdate}</span>
          </div>

          {data?.error && (
            <div style={{ fontSize: '0.75rem', color: '#ff4444' }}>
              {data.error}
            </div>
          )}

          {!loading && data?.ok && (data.activity?.length || 0) === 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Aun no hay mints recientes detectados en la ventana de bloques.
            </div>
          )}

          {(data?.activity?.length || 0) > 0 && (
            <div style={{ display: 'grid', gap: '0.5rem' }}>
              {data?.activity?.map((item) => (
                <div key={item.txHash} style={{ border: '1px solid var(--border)', padding: '0.7rem', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text)' }}>Token #{item.tokenId}</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Block {item.blockNumber}</span>
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    seed: {shortSeed(item.seed)}
                  </div>
                  <div style={{ marginTop: '0.35rem', fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                    wallet: {shortAddress(item.to)}
                  </div>
                  <a
                    href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginTop: '0.35rem', display: 'inline-block', fontSize: '0.68rem', color: 'var(--accent)', textDecoration: 'underline', fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    tx: {shortHash(item.txHash)}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .scan-link {
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--text);
          text-decoration: none;
          padding: 0.45rem 0.65rem;
          font-size: 0.7rem;
          font-family: 'JetBrains Mono', monospace;
        }
        .scan-link:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
      `}</style>
    </section>
  )
}
