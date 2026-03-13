'use client'

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'

const CONTRACT_ADDRESS = '0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf'

const CONTRACT_ABI = [
  'function totalSupply() view returns (uint256)',
  'function tokenIdToSeed(uint256) view returns (bytes32)'
]

interface MintedNFT {
  tokenId: number
  seed: string
}

export const Gallery = () => {
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFT[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedComposition, setSelectedComposition] = useState<any>(null)

  useEffect(() => {
    const fetchNFTs = async () => {
      try {
        setLoading(true)
        setError(null)
        
        if (typeof window === 'undefined' || !(window as any).ethereum) {
          setError('MetaMask no detectado. Por favor instala MetaMask.')
          return
        }

        const provider = new ethers.BrowserProvider((window as any).ethereum)
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

        const total = await contract.totalSupply()
        const totalNum = Number(total)

        if (totalNum === 0) {
          setMintedNFTs([])
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
          } catch (err) {
            console.warn(`Error reading token ${i}:`, err)
          }
        }

        setMintedNFTs(nfts)
      } catch (err: any) {
        console.error('Error fetching NFTs:', err)
        if (err.message?.includes('could not decode result data')) {
          setError('Error al leer el contrato. Verifica que el contrato exista en Sepolia.')
        } else if (err.message?.includes('network')) {
          setError('Error de red. Verifica que estés conectado a Sepolia testnet.')
        } else if (err.message?.includes('user rejected')) {
          setError('Conexión de wallet rechazada. Por favor conecta tu wallet.')
        } else {
          setError(`Error: ${err.message}`)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchNFTs()
  }, [])

  const handleSelectComposition = (composition: any) => {
    setSelectedComposition(composition)
  }

  return (
    <main>
      {/* HEADER */}
      <section style={{ marginBottom: '8vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h1 style={{ marginBottom: '3vh' }}>GALERÍA</h1>
        
        {loading ? (
          <p className="intro">Cargando tus VideoDanzas desde la blockchain...</p>
        ) : error ? (
          <p className="intro" style={{ color: '#d00', textAlign: 'center' }}>
            {error}
            <br />
            <br />
            <small>
              Contrato: <code style={{ background: '#eee', padding: '0.2rem 0.4rem' }}>
                0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf
              </code>
              <br />
              Sepolia Testnet: Chain ID 11155111
            </small>
          </p>
        ) : mintedNFTs.length > 0 ? (
          <>
            <p className="intro">
              Tienes <strong>{mintedNFTs.length}</strong> VideoDanzas minteadas en Sepolia.
              Cada una es única, determinística y permanente.
            </p>
            
            <section style={{ marginBottom: '12vh' }}>
              <h2 style={{ marginBottom: '4vh' }}>Tus VideoDanzas</h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '2vw'
              }}>
                {mintedNFTs.map((nft) => (
                  <div
                    key={nft.tokenId}
                    onClick={() => {
                      useGenerativeComposition(nft.seed as `0x${string}`).then(comp => {
                        if (comp) {
                          handleSelectComposition(comp)
                        }
                      })
                    }}
                    style={{
                      border: '1px solid #000',
                      cursor: 'pointer',
                      transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                      overflow: 'hidden',
                      aspectRatio: '1',
                      background: '#f0f0f0',
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
                        background: '#e0e0e0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      Cargando composición...
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
                        {nft.seed.slice(0, 10)}...{nft.slice(-6)}
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
      
      {/* DETAIL VIEW */}
      {selectedComposition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1rem',
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #000',
            maxWidth: '900px',
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
                onClick={() => setSelectedComposition(null)}
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
            
            <div style={{ padding: '2rem' }}>
              <h2 style={{ marginBottom: '1.5rem' }}>Visualización de Composición</h2>
              
              <div style={{
                aspectRatio: '16 / 9',
                background: 'linear-gradient(135deg, #f5f5f5, #e0e0e0)',
                border: '1px solid #e8e8e8',
                position: 'relative',
                marginBottom: '2rem',
                overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666',
                  fontSize: '1.5rem',
                }}>
                  Composición en reproducción
                </div>
              </div>
              
              <div style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '0.5rem' }}>Detalles de la Composición</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div>
                    <strong>Seed:</strong> {selectedComposition?.seed?.slice(0, 12)}...{selectedComposition?.seed?.slice(-6)}
                  </div>
                  <div>
                    <strong>Duración:</strong> ~10-60s (variada por composición)
                  </div>
                  <div>
                    <strong>Elementos:</strong> 5-24 capas de video
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}