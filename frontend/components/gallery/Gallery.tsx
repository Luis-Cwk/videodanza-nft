'use client'

import React, { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'

const CONTRACT_ADDRESS = '0x4986712a18eEc3559C29fC421Ad6D4BE38Faf763'

const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com'
const SEPOLIA_RPC_FALLBACK = 'https://sepolia.drpc.org'

const CONTRACT_ABI = [
  'function totalSupply() view returns (uint256)',
  'function tokenURI(uint256) view returns (string)'
]

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://nftstorage.link/ipfs',
  'https://ipfs.io/ipfs',
  'https://dweb.link/ipfs',
]

const getIPFSUrl = (uri: string, gatewayIndex: number = 0): string => {
  const gateway = IPFS_GATEWAYS[gatewayIndex % IPFS_GATEWAYS.length]
  return uri.replace('ipfs://', `${gateway}/`)
}

const getVideoUrl = (ipfsUri: string): string => {
  return `/api/video-proxy?uri=${encodeURIComponent(ipfsUri)}`
}

interface StoredComposition {
  name: string
  description: string
  seed: string
  seedPhrase: string
  theme: string
  layerCount: number
  totalDuration: number
  backgroundIntensity: number
  colorShift: number
  audioIntensity: number
  elements: StoredElement[]
}

interface StoredElement {
  videoKey: string
  videoName: string
  ipfsUri: string
  startTime: number
  duration: number
  scale: number
  opacity: number
  rotation: number
  positionX: number
  positionY: number
  blendMode: string
  effectId: number
  zIndex: number
}

interface NFTData {
  tokenId: number
  metadata: StoredComposition | null
  metadataUri: string
}

const CompositionPreview = ({ 
  composition, 
  onClick,
  size = 'normal'
}: { 
  composition: StoredComposition; 
  onClick?: () => void;
  size?: 'normal' | 'large'
}) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!composition || !containerRef.current) return
    const videos = containerRef.current.querySelectorAll('video')
    videos.forEach((video) => {
      video.play().catch(() => {})
    })
  }, [composition])

  const aspectRatio = size === 'large' ? '16/9' : '16/9'

  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid #000',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        overflow: 'hidden',
        aspectRatio,
        background: `linear-gradient(135deg, hsla(${composition.colorShift}, 70%, 50%, ${composition.backgroundIntensity * 0.3}), hsla(${composition.colorShift + 60}, 60%, 45%, ${composition.backgroundIntensity * 0.2}))`,
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }
      }}
    >
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        {composition.elements && Array.isArray(composition.elements) && composition.elements.map((element, idx) => (
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
    </div>
  )
}

export const Gallery = () => {
  const [nfts, setNfts] = useState<NFTData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNFT, setSelectedNFT] = useState<NFTData | null>(null)
  const [loadingMetadata, setLoadingMetadata] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  const fetchMetadata = async (uri: string): Promise<StoredComposition | null> => {
    try {
      const response = await fetch(`/api/ipfs-proxy?uri=${encodeURIComponent(uri)}`)
      if (!response.ok) {
        console.warn('IPFS proxy failed:', response.status)
        return null
      }
      const data = await response.json()
      return data as StoredComposition
    } catch (err) {
      console.error('Error fetching metadata:', err)
      return null
    }
  }

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true)
        setError(null)

        let provider: any
        let nftsData: NFTData[] = []
        let success = false

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
                await new Promise(r => setTimeout(r, 100))
                const metadataUri = await contract.tokenURI(i)
                nftsData.push({
                  tokenId: i,
                  metadata: null,
                  metadataUri
                })
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
                  await new Promise(r => setTimeout(r, 100))
                  const metadataUri = await contract.tokenURI(i)
                  nftsData.push({
                    tokenId: i,
                    metadata: null,
                    metadataUri
                  })
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
          setLoading(false)
          return
        }

        setError('No se pudo conectar a Sepolia. Intenta de nuevo más tarde.')
      } catch (err: any) {
        console.error('Error fetching NFTs:', err)
        if (err.message?.includes('could not decode result data')) {
          setError('Error al leer el contrato. Verifica que el contrato exista en Sepolia.')
        } else if (err.message?.includes('network')) {
          setError('Error de red. Verifica que estés conectado a Sepolia testnet.')
        } else {
          setError(`Error: ${err.message}`)
        }
      } finally {
        setLoading(false)
        setIsInitialized(true)
      }
    }

    fetchNFTs()
  }, [])

  useEffect(() => {
    if (nfts.length === 0) return

    const loadAllMetadata = async () => {
      setLoadingMetadata(true)
      const updatedNfts = [...nfts]
      
      for (let i = 0; i < updatedNfts.length; i++) {
        if (!updatedNfts[i].metadata) {
          const metadata = await fetchMetadata(updatedNfts[i].metadataUri)
          updatedNfts[i] = { ...updatedNfts[i], metadata }
        }
      }
      
      setNfts(updatedNfts)
      setLoadingMetadata(false)
    }

    loadAllMetadata()
  }, [nfts])

  // Show all NFTs, not just those with valid metadata
  const allNfts = nfts || []

  // Simple fallback preview for NFTs without metadata
  const SimplePreview = ({ tokenId, onClick }: { tokenId: number; metadataUri?: string; onClick?: () => void }) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    ]
    const gradient = colors[tokenId % colors.length]
    
    return (
      <div
        onClick={onClick}
        style={{
          border: '1px solid #000',
          cursor: onClick ? 'pointer' : 'default',
          overflow: 'hidden',
          aspectRatio: '16/9',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
        }}>
          <span style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>#{tokenId + 1}</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>VideoDanza</span>
        </div>
      </div>
    )
  }

  return (
    <main>
      <section style={{ marginBottom: '8vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h1 style={{ marginBottom: '3vh' }}>GALERÍA</h1>

        {loading || !isInitialized ? (
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
        ) : allNfts.length > 0 ? (
          <>
            <p className="intro">
              Tienes <strong>{allNfts.length}</strong> VideoDanzas minteadas en Sepolia.
              {loadingMetadata && ' Cargando composiciones...'}
            </p>

            <section style={{ marginBottom: '12vh' }}>
              <h2 style={{ marginBottom: '4vh' }}>Tus VideoDanzas</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '2vw'
              }}>
                {allNfts.map(({ tokenId, metadata, metadataUri }) => (
                  <div key={tokenId}>
                    {metadata ? (
                      <CompositionPreview
                        composition={metadata}
                        onClick={() => setSelectedNFT({ tokenId, metadata, metadataUri })}
                      />
                    ) : (
                      <SimplePreview
                        tokenId={tokenId}
                        metadataUri={metadataUri}
                        onClick={() => setSelectedNFT({ tokenId, metadata: null, metadataUri })}
                      />
                    )}
                    <div style={{ padding: '2vh 2vw', background: '#fff', border: '1px solid #000', borderTop: 'none' }}>
                      <h3
                        style={{
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          textTransform: 'uppercase',
                          marginBottom: '0.8vh',
                          lineHeight: 1.2,
                        }}
                      >
                        VideoDanza #{tokenId + 1}
                      </h3>
                      <p
                        style={{
                          fontSize: '0.8rem',
                          fontFamily: "'Space Grotesk', sans-serif",
                          color: '#666',
                          fontWeight: 300,
                        }}
                      >
                        {metadata && metadata.elements ? `${metadata.theme} • ${metadata.elements.length} capas` : 'Cargando metadata...'}
                      </p>
                    </div>
                  </div>
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

      {selectedNFT && selectedNFT.metadata && (
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
              <button
                onClick={() => setSelectedNFT(null)}
                style={{
                  background: 'transparent',
                  border: '1px solid #000',
                  color: '#000',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                ← Volver a la Galería
              </button>
              <button
                onClick={() => setSelectedNFT(null)}
                style={{
                  background: '#fff',
                  border: '2px solid #000',
                  fontSize: '1.2rem',
                  cursor: 'pointer',
                  padding: '0.5rem 1rem',
                  color: '#000',
                  lineHeight: 1,
                  fontWeight: 'bold',
                }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem', textTransform: 'capitalize' }}>
                VideoDanza #{selectedNFT.tokenId + 1} - {selectedNFT.metadata.theme}
              </h2>

              <CompositionPreview 
                composition={selectedNFT.metadata} 
                size="large"
              />

              <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Detalles de la Composición</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                    <strong>Theme:</strong> {selectedNFT.metadata.theme}
                  </div>
                  <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                    <strong>Capas:</strong> {selectedNFT.metadata.elements.length}
                  </div>
                  <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                    <strong>Duración:</strong> {selectedNFT.metadata.totalDuration}s
                  </div>
                  <div style={{ padding: '1rem', background: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                    <strong>Intensidad Audio:</strong> {(selectedNFT.metadata.audioIntensity * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Videos utilizados:</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {selectedNFT.metadata.elements.map((el, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: '0.3rem 0.8rem',
                        background: '#e8e8e8',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontFamily: "'Space Grotesk', sans-serif",
                      }}
                    >
                      {el.videoName}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                <h4 style={{ marginBottom: '0.5rem' }}>Seed:</h4>
                <code style={{ fontSize: '0.75rem', wordBreak: 'break-all', display: 'block', padding: '1rem', background: '#f5f5f5' }}>
                  {selectedNFT.metadata.seed}
                </code>
              </div>

              {selectedNFT.metadata.seedPhrase && (
                <div style={{ marginBottom: '2rem' }}>
                  <h4 style={{ marginBottom: '0.5rem' }}>Frase-semilla:</h4>
                  <code style={{ fontSize: '0.85rem', display: 'block', padding: '1rem', background: '#f5f5f5' }}>
                    {selectedNFT.metadata.seedPhrase}
                  </code>
                </div>
              )}

              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Metadata IPFS:</h4>
                <a 
                  href={getIPFSUrl(selectedNFT.metadataUri)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: '0.75rem', wordBreak: 'break-all', color: '#0066cc' }}
                >
                  {selectedNFT.metadataUri}
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
