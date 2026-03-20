'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { VideodanzaPlayer } from '@/components/player/VideodanzaPlayer'

const CONTRACT_ADDRESS = '0x4986712a18eEc3559C29fC421Ad6D4BE38Faf763'

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
      <div style={{
        border: '1px solid #000',
        aspectRatio: '3/4',
        background: '#f5f5f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: '#999', fontSize: '0.8rem' }}>Cargando...</span>
      </div>
    )
  }

  return (
    <div 
      onClick={onClick} 
      style={{ 
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}
    >
      <div style={{
        border: '1px solid #000',
        overflow: 'hidden',
      }}>
        <VideodanzaPlayer 
          elements={composition.elements} 
          autoPlay={true}
          muted={true}
        />
      </div>
      <div style={{ 
        padding: '2vh 1.5vw', 
        background: '#fff', 
        border: '1px solid #000', 
        borderTop: 'none' 
      }}>
        <h3 style={{ 
          fontSize: '0.9rem', 
          fontWeight: 700, 
          textTransform: 'uppercase', 
          marginBottom: '0.5vh', 
          lineHeight: 1.2 
        }}>
          VideoDanza #{tokenId + 1}
        </h3>
        <p style={{ 
          fontSize: '0.75rem', 
          fontFamily: "'Space Grotesk', sans-serif", 
          color: '#666', 
          fontWeight: 300,
          margin: 0
        }}>
          {composition.theme} • {composition.elements.length} capas
        </p>
      </div>
    </div>
  )
}

const NFTModal = ({ tokenId, seed, onClose }: { tokenId: number; seed: string; onClose: () => void }) => {
  const composition = useGenerativeComposition(seed as `0x${string}`)
  
  // Cerrar con Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])
  
  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  if (!composition) return null

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2vh 2vw',
        overflowY: 'auto',
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          border: '1px solid #000',
          maxWidth: '900px',
          width: '100%',
          marginTop: '4vh',
          marginBottom: '4vh',
        }}
      >
        {/* Header del modal */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2vh 2vw',
          borderBottom: '1px solid #e8e8e8',
        }}>
          <h2 style={{ 
            fontSize: '1.2rem', 
            fontWeight: 700, 
            textTransform: 'capitalize',
            margin: 0
          }}>
            VideoDanza #{tokenId + 1} — {composition.theme}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'transparent',
              border: '2px solid #000',
              fontSize: '1.2rem',
              cursor: 'pointer',
              padding: '0.5rem 1rem',
              color: '#000',
              fontWeight: 'bold',
              lineHeight: 1,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#000'
              e.currentTarget.style.color = '#fff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = '#000'
            }}
          >
            ✕
          </button>
        </div>

        {/* Contenido del modal */}
        <div style={{ padding: '3vh 2vw' }}>
          {/* Video player */}
          <div style={{
            border: '1px solid #000',
            overflow: 'hidden',
            marginBottom: '3vh',
          }}>
            <VideodanzaPlayer 
              elements={composition.elements} 
              autoPlay={true}
              muted={false}
            />
          </div>

          {/* Detalles */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '1rem',
            marginBottom: '3vh'
          }}>
            <div style={{ padding: '1.5vh 1vw', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#666', marginBottom: '0.5vh' }}>Tema</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{composition.theme}</div>
            </div>
            <div style={{ padding: '1.5vh 1vw', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#666', marginBottom: '0.5vh' }}>Capas</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{composition.elements.length}</div>
            </div>
            <div style={{ padding: '1.5vh 1vw', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#666', marginBottom: '0.5vh' }}>Duración</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{composition.totalDuration.toFixed(1)}s</div>
            </div>
            <div style={{ padding: '1.5vh 1vw', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700, color: '#666', marginBottom: '0.5vh' }}>Audio</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{(composition.audioIntensity * 100).toFixed(0)}%</div>
            </div>
          </div>

          {/* Videos utilizados */}
          <div style={{ marginBottom: '3vh' }}>
            <h4 style={{ 
              fontSize: '0.7rem', 
              textTransform: 'uppercase', 
              fontWeight: 700, 
              marginBottom: '1vh',
              color: '#666'
            }}>
              Videos utilizados
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {composition.elements.map((el, idx) => (
                <span key={idx} style={{
                  padding: '0.4rem 0.8rem',
                  background: '#f5f5f5',
                  border: '1px solid #e0e0e0',
                  fontSize: '0.7rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {el.videoName}
                </span>
              ))}
            </div>
          </div>

          {/* Seed */}
          <div>
            <h4 style={{ 
              fontSize: '0.7rem', 
              textTransform: 'uppercase', 
              fontWeight: 700, 
              marginBottom: '1vh',
              color: '#666'
            }}>
              Seed
            </h4>
            <code style={{ 
              fontSize: '0.7rem', 
              wordBreak: 'break-all', 
              display: 'block', 
              padding: '1rem', 
              background: '#f5f5f5',
              border: '1px solid #e0e0e0',
              fontFamily: "'Space Grotesk', sans-serif",
            }}>
              {seed}
            </code>
          </div>
        </div>
      </div>
    </div>
  )
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
      <section style={{ marginBottom: '8vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h1 style={{ marginBottom: '3vh' }}>GALERÍA</h1>

        {loading ? (
          <p className="intro">Cargando tus VideoDanzas desde la blockchain...</p>
        ) : error ? (
          <p className="intro" style={{ color: '#d00', textAlign: 'center' }}>
            {error}
            <br /><br />
            <small>
              Contrato: <code style={{ background: '#eee', padding: '0.2rem 0.4rem' }}>
                0x4986712a18eEc3559C29fC421Ad6D4BE38Faf763
              </code><br />
              Sepolia Testnet: Chain ID 11155111
            </small>
          </p>
        ) : nfts.length > 0 ? (
          <>
            <p className="intro">
              Tienes <strong>{nfts.length}</strong> VideoDanzas minteadas en Sepolia.
            </p>

            <section style={{ marginTop: '6vh' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2.5vw',
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
          <p className="intro">
            No tienes VideoDanzas minteadas aún.
            Ve a "Crear NFT" para acuñar tu primera composición.
          </p>
        )}
      </section>

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
