'use client'

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { useAccount } from 'wagmi'

const CONTRACT_ADDRESS = '0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf'

const CONTRACT_ABI = [
  'function totalSupply() view returns (uint256)',
  'function tokenIdToSeed(uint256) view returns (bytes32)'
]

interface MintedNFT {
  tokenId: number
  seed: string
  seedPhrase?: string
  owner?: string
}

export const Gallery = () => {
  const { address, isConnected } = useAccount()
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedComposition, setSelectedComposition] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchNFTs = useCallback(async () => {
    if (!address) return
    
    try {
      setLoading(true)
      setError(null)
      
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      
      const total = await contract.totalSupply()
      const totalNum = Number(total)
      
      if (totalNum === 0) {
        setMintedNFTs([])
        setLoading(false)
        return
      }

      const nfts: MintedNFT[] = []
      for (let i = 0; i < totalNum; i++) {
        try {
          const seed = await contract.tokenIdToSeed(i)
          nfts.push({
            tokenId: i,
            seed: seed,
          })
        } catch (e) {
          console.log(`Error fetching token ${i}:`, e)
        }
      }

      setMintedNFTs(nfts)
    } catch (e) {
      console.error('Error fetching NFTs:', e)
      setError('Error al conectar con el contrato. Asegúrate de estar conectado a Sepolia.')
    } finally {
      setLoading(false)
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      fetchNFTs()
    } else {
      setMintedNFTs([])
      setLoading(false)
    }
  }, [isConnected, address, fetchNFTs])

  const handleSelectComposition = (composition: any) => {
    setSelectedComposition(composition)
  }

  return (
    <main>
      {/* HEADER */}
      <section style={{ marginBottom: '8vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h1 style={{ marginBottom: '3vh' }}>GALERÍA</h1>
        
        {!isConnected ? (
          <p className="intro">
            Conecta tu wallet para ver tus VideoDanzas minteadas.
          </p>
        ) : loading ? (
          <p className="intro">Cargando tus VideoDanzas desde la blockchain...</p>
        ) : error ? (
          <p className="intro" style={{ color: '#d00' }}>{error}</p>
        ) : mintedNFTs.length > 0 ? (
          <p className="intro">
            Tienes <strong>{mintedNFTs.length}</strong> VideoDanzas minteadas en Sepolia.
          </p>
        ) : (
          <p className="intro">
            No tienes VideoDanzas minteadas aún. Ve a "Crear NFT" para acuñar tu primera.
          </p>
        )}
      </section>

      {/* NFTS GRID */}
      {!loading && mintedNFTs.length > 0 && (
        <section style={{ marginBottom: '12vh' }}>
          <h2 style={{ marginBottom: '4vh' }}>Tus VideoDanzas</h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '2vw'
          }}>
            {mintedNFTs.map((nft) => (
              <MintedCard
                key={nft.tokenId}
                nft={nft}
                onSelect={() => handleSelectComposition(nft)}
              />
            ))}
          </div>
        </section>
      )}

      {/* DETAIL MODAL */}
      {selectedComposition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: '#000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
          overflow: 'auto',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #000',
            maxWidth: '1000px',
            width: '100%',
            maxHeight: '100vh',
            overflow: 'auto',
            position: 'relative',
          }}>
            {/* Header with close button - always visible */}
            <div style={{
              position: 'sticky',
              top: 0,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 1.5rem',
              borderBottom: '1px solid #e8e8e8',
              background: '#fff',
              zIndex: 102
            }}>
              <button
                onClick={() => setSelectedComposition(null)}
                style={{
                  background: '#000',
                  color: '#fff',
                  border: 'none',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.6rem 1rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                ← Volver
              </button>
              <button
                onClick={() => setSelectedComposition(null)}
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

            <CompositionDetail composition={selectedComposition} />
          </div>
        </div>
      )}
    </main>
  )
}

interface MintedCardProps {
  nft: MintedNFT
  onSelect: () => void
}

const MintedCard = ({ nft, onSelect }: MintedCardProps) => {
  const generativeComposition = useGenerativeComposition(nft.seed as `0x${string}`)

  return (
    <div
      onClick={onSelect}
      style={{
        border: '1px solid #000',
        cursor: 'pointer',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        overflow: 'hidden',
        background: generativeComposition
          ? `linear-gradient(135deg, hsla(${generativeComposition.colorShift}, 70%, 50%, ${generativeComposition.backgroundIntensity * 0.3}), hsla(${generativeComposition.colorShift + 60}, 60%, 45%, ${generativeComposition.backgroundIntensity * 0.2}))`
          : '#000',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(-4px)'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
    >
      <div
        style={{
          aspectRatio: '1',
          position: 'relative',
          overflow: 'hidden',
          background: generativeComposition
            ? `linear-gradient(135deg, hsla(${generativeComposition.colorShift}, 70%, 50%, ${generativeComposition.backgroundIntensity * 0.3}), hsla(${generativeComposition.colorShift + 60}, 60%, 45%, ${generativeComposition.backgroundIntensity * 0.2}))`
            : '#000',
        }}
      >
        {/* Videos en vivo */}
        {generativeComposition && generativeComposition.elements.slice(0, 4).map((element, idx) => {
          const gatewayUrl = element.ipfsUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
          return (
            <video
              key={idx}
              src={gatewayUrl}
              autoPlay
              loop
              muted
              playsInline
              style={{
                position: 'absolute',
                left: `${element.positionX}%`,
                top: `${element.positionY}%`,
                width: `${30 * element.scale}%`,
                aspectRatio: '1',
                objectFit: 'cover',
                transform: `rotate(${element.rotation}deg)`,
                opacity: element.opacity * 0.8,
                mixBlendMode: element.blendMode as any,
                zIndex: element.zIndex,
              }}
            />
          )
        })}
        
        {/* Overlay con info */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
          padding: '1rem',
          color: '#fff',
          zIndex: 20,
        }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>#{nft.tokenId}</div>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {generativeComposition?.theme} • {generativeComposition?.elements.length} capas
          </div>
        </div>
      </div>

      <div style={{ padding: '2vh 2vw', background: '#fff' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginBottom: '0.8vh',
            lineHeight: 1.2,
          }}
        >
          VideoDanza #{nft.tokenId}
        </h3>
        <p
          style={{
            fontSize: '0.8rem',
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#666',
            fontWeight: 300,
          }}
        >
          {generativeComposition ? `${generativeComposition.totalDuration.toFixed(1)}s` : 'Cargando...'}
        </p>
      </div>
    </div>
  )
}

interface CompositionDetailProps {
  composition: { phrase?: string; seed: `0x${string}`; tokenId?: number }
}

const CompositionDetail = ({ composition }: CompositionDetailProps) => {
  const generativeComposition = useGenerativeComposition(composition.seed)

  if (!generativeComposition) {
    return (
      <div style={{ padding: '4vh 4vw', textAlign: 'center' }}>
        Generando composición...
      </div>
    )
  }

  return (
    <div style={{ padding: '4vh 4vw' }}>
      {composition.tokenId !== undefined && (
        <h2 style={{ marginBottom: '2vh' }}>VideoDanza #{composition.tokenId}</h2>
      )}
      {composition.phrase && (
        <h2 style={{ marginBottom: '2vh' }}>"{composition.phrase}"</h2>
      )}

      {/* VISUALIZATION */}
      <div
        style={{
          aspectRatio: '16 / 9',
          background: `linear-gradient(135deg, hsla(${generativeComposition.colorShift}, 70%, 50%, ${generativeComposition.backgroundIntensity * 0.3}), hsla(${generativeComposition.colorShift + 60}, 60%, 45%, ${generativeComposition.backgroundIntensity * 0.2}))`,
          border: '1px solid #e8e8e8',
          position: 'relative',
          marginBottom: '4vh',
          overflow: 'hidden',
        }}
      >
        {generativeComposition.elements.map((element, idx) => {
          const gatewayUrl = element.ipfsUri.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')
          return (
            <video
              key={idx}
              src={gatewayUrl}
              autoPlay
              loop
              muted
              playsInline
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
          )
        })}
      </div>

      {/* SPEC GRID */}
      <div style={{ marginBottom: '4vh' }}>
        <h3 style={{ marginBottom: '2vh' }}>Parámetros Generados</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '2vh' }}>
          <div style={{ padding: '1.5vh', background: '#f5f5f5', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Tema</div>
            <div style={{ fontSize: '1rem', textTransform: 'capitalize' }}>{generativeComposition.theme}</div>
          </div>
          <div style={{ padding: '1.5vh', background: '#f5f5f5', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Duración</div>
            <div style={{ fontSize: '1rem' }}>{generativeComposition.totalDuration.toFixed(1)}s</div>
          </div>
          <div style={{ padding: '1.5vh', background: '#f5f5f5', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Capas</div>
            <div style={{ fontSize: '1rem' }}>{generativeComposition.elements.length}</div>
          </div>
          <div style={{ padding: '1.5vh', background: '#f5f5f5', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Intensidad BG</div>
            <div style={{ fontSize: '1rem' }}>{Math.round(generativeComposition.backgroundIntensity * 100)}%</div>
          </div>
        </div>
      </div>

      {/* ELEMENTS */}
      <div style={{ marginBottom: '4vh' }}>
        <h3 style={{ marginBottom: '2vh' }}>Capas Generadas</h3>
        <div style={{ display: 'grid', gap: '1.5vh' }}>
          {generativeComposition.elements.map((element, idx) => (
            <div key={idx} style={{ border: '1px solid #e8e8e8', padding: '2vh 2vw' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1vw' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Capa {idx + 1}</div>
                  <div style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif" }}>{element.videoName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Blend</div>
                  <div style={{ fontSize: '0.9rem' }}>{element.blendMode}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Opacidad</div>
                  <div style={{ fontSize: '0.9rem' }}>{Math.round(element.opacity * 100)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>Escala</div>
                  <div style={{ fontSize: '0.9rem' }}>{Math.round(element.scale * 100)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEED INFO */}
      <div style={{ borderTop: '1px solid #000', paddingTop: '3vh' }}>
        <h3 style={{ marginBottom: '2vh' }}>Información del Seed</h3>
        <div style={{
          padding: '2vh 2vw',
          background: '#f5f5f5',
          border: '1px solid #e8e8e8',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.85rem',
          wordBreak: 'break-all'
        }}>
          {composition.phrase && (
            <div style={{ marginBottom: '1vh' }}>
              <strong>Semilla original:</strong> "{composition.phrase}"
            </div>
          )}
          <div>
            <strong>Seed Hash (0x):</strong> {composition.seed}
          </div>
        </div>
      </div>
    </div>
  )
}
