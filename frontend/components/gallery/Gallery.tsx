'use client'

import React, { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useGenerativeComposition, GenerativeComposition } from '@/lib/hooks/useGenerativeComposition'

const CONTRACT_ADDRESS = '0x4986712a18eEc3559C29fC421Ad6D4BE38Faf763'

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com'
const SEPOLIA_RPC_FALLBACK = 'https://sepolia.drpc.org'

const CONTRACT_ABI = [
  'function totalSupply() view returns (uint256)',
  'function tokenIdToSeed(uint256) view returns (bytes32)',
  'function tokenURI(uint256) view returns (string)'
]

const getVideoUrl = (ipfsUri: string): string => {
  if (ipfsUri.includes('gateway.pinata.cloud/ipfs/')) {
    const cid = ipfsUri.split('/ipfs/')[1]
    return `/api/video-proxy?uri=ipfs%3A%2F%2F${cid}`
  }
  return `/api/video-proxy?uri=${encodeURIComponent(ipfsUri)}`
}

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
        aspectRatio: '16/9',
        background: '#f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <span style={{ color: '#999' }}>Cargando...</span>
      </div>
    )
  }

  return (
    <div onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{
        border: '1px solid #000',
        overflow: 'hidden',
        aspectRatio: '16/9',
        background: `linear-gradient(135deg, hsla(${composition.colorShift}, 70%, 50%, ${composition.backgroundIntensity * 0.3}), hsla(${composition.colorShift + 60}, 60%, 45%, ${composition.backgroundIntensity * 0.2}))`,
        position: 'relative',
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
        {composition.elements.map((element, idx) => (
          <video
            key={idx}
            src={getVideoUrl(element.ipfsUri)}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            style={{
              position: 'absolute',
              left: `${element.positionX}%`,
              top: `${element.positionY}%`,
              width: `${20 * element.scale}%`,
              aspectRatio: '1',
              objectFit: 'cover',
              transform: `rotate(${element.rotation}deg)`,
              opacity: element.opacity,
              mixBlendMode: element.blendMode as any,
              zIndex: element.zIndex,
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
      <div style={{ padding: '2vh 2vw', background: '#fff', border: '1px solid #000', borderTop: 'none' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.8vh', lineHeight: 1.2 }}>
          VideoDanza #{tokenId + 1}
        </h3>
        <p style={{ fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", color: '#666', fontWeight: 300 }}>
          {composition.theme} • {composition.elements.length} capas
        </p>
      </div>
    </div>
  )
}

const NFTModal = ({ tokenId, seed, onClose }: { tokenId: number; seed: string; onClose: () => void }) => {
  const composition = useGenerativeComposition(seed as `0x${string}`)
  
  if (!composition) return null

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #000',
        maxWidth: '1000px',
        width: '95vw',
        maxHeight: '95vh',
        overflow: 'auto',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem 1.5rem',
          borderBottom: '1px solid #e8e8e8',
          background: '#f8f9fa',
        }}>
          <button onClick={onClose} style={{
            background: 'transparent',
            border: '1px solid #000',
            color: '#000',
            fontSize: '1rem',
            cursor: 'pointer',
          }}>
            ← Volver a la Galería
          </button>
          <button onClick={onClose} style={{
            background: '#fff',
            border: '2px solid #000',
            fontSize: '1.2rem',
            cursor: 'pointer',
            padding: '0.5rem 1rem',
            color: '#000',
            fontWeight: 'bold',
          }}>
            ✕
          </button>
        </div>

        <div style={{ padding: '2rem' }}>
          <h2 style={{ marginBottom: '1.5rem', textTransform: 'capitalize' }}>
            VideoDanza #{tokenId + 1} - {composition.theme}
          </h2>

          <div style={{
            border: '1px solid #000',
            overflow: 'hidden',
            aspectRatio: '16/9',
            background: `linear-gradient(135deg, hsla(${composition.colorShift}, 70%, 50%, ${composition.backgroundIntensity * 0.3}), hsla(${composition.colorShift + 60}, 60%, 45%, ${composition.backgroundIntensity * 0.2}))`,
            position: 'relative',
            marginBottom: '2rem',
          }}>
            {composition.elements.map((element, idx) => (
              <video
                key={idx}
                src={getVideoUrl(element.ipfsUri)}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                style={{
                  position: 'absolute',
                  left: `${element.positionX}%`,
                  top: `${element.positionY}%`,
                  width: `${20 * element.scale}%`,
                  aspectRatio: '1',
                  objectFit: 'cover',
                  transform: `rotate(${element.rotation}deg)`,
                  opacity: element.opacity,
                  mixBlendMode: element.blendMode as any,
                  zIndex: element.zIndex,
                }}
              />
            ))}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Detalles de la Composición</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <strong>Tema:</strong> {composition.theme}
              </div>
              <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <strong>Capas:</strong> {composition.elements.length}
              </div>
              <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <strong>Duración:</strong> {composition.totalDuration.toFixed(1)}s
              </div>
              <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                <strong>Intensidad Audio:</strong> {(composition.audioIntensity * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Videos utilizados:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {composition.elements.map((el, idx) => (
                <span key={idx} style={{
                  padding: '0.3rem 0.8rem',
                  background: '#e8e8e8',
                  borderRadius: '4px',
                  fontSize: '0.75rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}>
                  {el.videoName}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '0.5rem' }}>Seed:</h4>
            <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block', padding: '1rem', background: '#f5f5f5' }}>
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

            <section style={{ marginBottom: '12vh' }}>
              <h2 style={{ marginBottom: '4vh' }}>Tus VideoDanzas</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '2vw'
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
