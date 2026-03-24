'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { VideodanzaPlayer } from '@/components/player/VideodanzaPlayer'

const CONTRACT_ADDRESS = '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828'

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com'
const SEPOLIA_RPC_FALLBACK = 'https://sepolia.drpc.org'

const CONTRACT_ABI = [
  'function totalSupply() view returns (uint256)',
  'function tokenIdToSeed(uint256) view returns (bytes32)',
  'function tokenURI(uint256) view returns (string)'
]

interface NFTCardProps {
  tokenId: number
  seed: string
  onClick: () => void
}

const NFTCard = ({ tokenId, seed, onClick }: NFTCardProps) => {
  const composition = useGenerativeComposition(seed as `0x${string}`)
  
  if (!composition) {
    return (
      <div className="nft-card">
        <div className="nft-card-media loading-skeleton" />
        <div className="nft-card-info">
          <div className="nft-card-title">Cargando...</div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="nft-card"
      onClick={onClick}
    >
      <div className="nft-card-media">
        <VideodanzaPlayer 
          elements={composition.elements} 
          autoPlay={true}
          muted={false}
          hoverSound={true}
        />
      </div>
      <div className="nft-card-info">
        <div className="nft-card-title">VideoDanza #{tokenId + 1}</div>
        <div className="nft-card-meta">
          {composition.theme} • {composition.elements.length} capas
        </div>
      </div>
    </div>
  )
}

const NFTModal = ({ tokenId, seed, onClose }: { tokenId: number; seed: string; onClose: () => void }) => {
  const composition = useGenerativeComposition(seed as `0x${string}`)
  
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])
  
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!composition) return null

  return (
    <div 
      className="modal-overlay"
      onClick={onClose}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 style={{ fontSize: '1rem', margin: 0 }}>
            VideoDanza #{tokenId + 1} — <span className="text-accent">{composition.theme}</span>
          </h2>
          <button 
            className="modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div style={{ border: '1px solid var(--border-bright)', marginBottom: '1.5rem' }}>
            <VideodanzaPlayer 
              elements={composition.elements} 
              autoPlay={true}
              muted={false}
            />
          </div>

          <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
            <div className="stat-item">
              <div className="stat-label">Tema</div>
              <div className="stat-value">{composition.theme}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Capas</div>
              <div className="stat-value">{composition.elements.length}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Duración</div>
              <div className="stat-value">{composition.totalDuration.toFixed(1)}s</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Audio</div>
              <div className="stat-value">{(composition.audioIntensity * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div className="data-panel-label">Videos utilizados</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {composition.elements.map((el, idx) => (
                <span key={idx} style={{
                  padding: '0.4rem 0.8rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border-bright)',
                  fontSize: '0.7rem',
                  fontFamily: "'JetBrains Mono', monospace",
                }}>
                  {el.videoName}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div className="data-panel-label">Seed</div>
            <code style={{ 
              fontSize: '0.7rem', 
              wordBreak: 'break-all', 
              display: 'block', 
              padding: '1rem', 
              background: 'var(--surface)',
              border: '1px solid var(--border-bright)',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {seed}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}

const TimeDisplay = () => {
  const [time, setTime] = useState<string>('')
  useEffect(() => { setTime(Date.now().toString()) }, [])
  return <>{time}</>
}

export const Gallery = () => {
  const [nfts, setNfts] = useState<{ tokenId: number; seed: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNFT, setSelectedNFT] = useState<{ tokenId: number; seed: string } | null>(null)

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true)
        setError(null)

        let provider: any
        let success = false
        const nftsData: { tokenId: number; seed: string }[] = []

        const rpcUrls = [SEPOLIA_RPC, SEPOLIA_RPC_FALLBACK]

        for (const rpcUrl of rpcUrls) {
          try {
            provider = new ethers.JsonRpcProvider(rpcUrl)
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
            
            const total = await contract.totalSupply()
            const totalNum = Number(total)
            
            if (totalNum === 0) {
              setNfts([])
              setLoading(false)
              return
            }

            for (let i = 0; i < totalNum; i++) {
              try {
                await new Promise(r => setTimeout(r, 200))
                const seed = await contract.tokenIdToSeed(i)
                nftsData.push({ tokenId: i, seed })
              } catch (err) {
                console.warn(`Error reading token ${i}:`, err)
              }
            }
            
            success = true
            break
          } catch (e) {
            console.warn(`RPC ${rpcUrl} failed:`, e)
            continue
          }
        }

        if (!success && typeof window !== 'undefined' && (window as any).ethereum) {
          try {
            provider = new ethers.BrowserProvider((window as any).ethereum)
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
            
            const total = await contract.totalSupply()
            const totalNum = Number(total)
            
            if (totalNum > 0) {
              for (let i = 0; i < totalNum; i++) {
                try {
                  await new Promise(r => setTimeout(r, 200))
                  const seed = await contract.tokenIdToSeed(i)
                  nftsData.push({ tokenId: i, seed })
                } catch (err) {
                  console.warn(`Error reading token ${i}:`, err)
                }
              }
              success = true
            }
          } catch (e) {
            console.warn('MetaMask also failed:', e)
          }
        }

        if (success) {
          setNfts(nftsData)
        } else {
          setError('No se pudo conectar a Sepolia. Intenta de nuevo más tarde.')
        }
      } catch (err: any) {
        console.error('Error fetching NFTs:', err)
        setError(`Error: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  return (
    <main>
      <div className="page-content">
        <section className="hero-section">
          <h1>GALERÍA</h1>

          {loading ? (
            <p className="intro">Cargando tus VideoDanzas desde la blockchain...</p>
          ) : error ? (
            <div className="message error">
              {error}
              <div className="mt-2 text-muted" style={{ fontSize: '0.8rem' }}>
                Contrato: <code>0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828</code>
                <br />
                Sepolia Testnet: Chain ID 11155111
              </div>
            </div>
          ) : nfts.length > 0 ? (
            <>
              <p className="intro">
                Tienes <span className="text-accent">{nfts.length}</span> VideoDanzas minteadas en Sepolia.
              </p>

              <section className="mt-3">
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '1px',
                  background: 'var(--border)',
                  border: '1px solid var(--border-bright)',
                }}>
                  {nfts.map(({ tokenId, seed }) => (
                    <NFTCard
                      key={tokenId}
                      tokenId={tokenId}
                      seed={seed}
                      onClick={() => setSelectedNFT({ tokenId, seed })}
                    />
                  ))}
                </div>
              </section>
            </>
          ) : (
            <p className="intro text-dim">
              No tienes VideoDanzas minteadas aún.
              <br />
              Ve a <span className="text-accent">[_mint]</span> para acuñar tu primera composición.
            </p>
          )}
        </section>

        <section className="mt-3">
          <div className="telemetry">
            <span>STATUS: {loading ? 'LOADING' : error ? 'ERROR' : 'READY'}</span>
            <span>│</span>
            <span>TOKENS: {nfts.length}</span>
            <span>│</span>
            <span>NETWORK: SEPOLIA</span>
            <span>│</span>
            <span>TIMESTAMP: </span><TimeDisplay />
          </div>
        </section>
      </div>

      {selectedNFT && (
        <NFTModal
          tokenId={selectedNFT.tokenId}
          seed={selectedNFT.seed}
          onClose={() => setSelectedNFT(null)}
        />
      )}
    </main>
  )
}
