'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useForm } from 'react-hook-form'
import { useMintNFT } from '@/lib/hooks/useContract'
import { useIPFSLookupTable } from '@/lib/hooks/useIPFS'
import { ethers } from 'ethers'

interface MintFormData {
  seedPhrase: string
}

export const MintCard = () => {
  const { isConnected, address } = useAccount()
  const { register, handleSubmit, watch } = useForm<MintFormData>()
  const [seed, setSeed] = useState<`0x${string}` | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hoveredVideo, setHoveredVideo] = useState<string | null>(null)

  const { videos, loading: videosLoading } = useIPFSLookupTable()
  const { mint, isPending, isSuccess, hash, error: mintError, status } = useMintNFT()

  const seedPhrase = watch('seedPhrase')
  const mintPrice = '1000000000000000' // 0.001 ETH in wei
  const isSeedMinted = false

  // Generate seed from phrase
  useEffect(() => {
    if (seedPhrase && typeof seedPhrase === 'string' && seedPhrase.trim()) {
      try {
        const hashedSeed = ethers.keccak256(ethers.toUtf8Bytes(seedPhrase))
        setSeed(hashedSeed as `0x${string}`)
      } catch (err) {
        setSeed(null)
      }
    } else {
      setSeed(null)
    }
  }, [seedPhrase])

  // Handle successful mint
  useEffect(() => {
    if (isSuccess) {
      setSuccess(`✓ NFT acuñado exitosamente! TX: ${hash}`)
      setTimeout(() => setSuccess(null), 5000)
    }
  }, [isSuccess, hash])

  const onSubmit = async (_data: MintFormData) => {
    try {
      setError(null)

      if (!isConnected) {
        setError('Conecta tu wallet para continuar')
        return
      }

      if (!seed) {
        setError('Ingresa una seed phrase válida')
        return
      }

      if (isSeedMinted) {
        setError('Esta seed ya ha sido acuñada')
        return
      }

      if (!selectedVideo) {
        setError('Selecciona un video')
        return
      }

      // Get the IPFS metadata URI for the selected video
      const videoData = videos[selectedVideo]
      if (!videoData) {
        setError('No se encontró la metadata del video')
        return
      }

      // Use the IPFS URI (ipfs://Qm...) for the contract
      const metadataURI = videoData.ipfs
      if (!metadataURI) {
        setError('No se encontró la URI IPFS del video')
        return
      }

      console.log('Calling mint with:', { seed, metadataURI, mintPrice })
      await mint(seed, metadataURI, mintPrice)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Error al acuñar')
    }
  }

  const formattedPrice = mintPrice ? (Number(mintPrice) / 1e18).toFixed(3) : '0.001'
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

  return (
    <div style={{ marginBottom: '8vh' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STATUS BANNER */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: '1.5vw',
          marginBottom: '6vh',
          padding: '0'
        }}>
          <div style={{
            padding: '2vh 2vw',
            border: '1px solid #e8e8e8',
            background: isConnected ? '#f5f5f5' : '#fff',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', color: '#666', marginBottom: '0.8vh' }}>
              Wallet
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              {isConnected ? (shortAddress || 'Conectado') : 'Desconectado'}
            </div>
          </div>

          <div style={{
            padding: '2vh 2vw',
            border: '1px solid #e8e8e8',
            background: '#f5f5f5',
          }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', color: '#666', marginBottom: '0.8vh' }}>
              Red
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              Sepolia
            </div>
          </div>

          <div style={{
            padding: '2vh 2vw',
            border: '1px solid #e8e8e8',
            background: '#f5f5f5',
          }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', color: '#666', marginBottom: '0.8vh' }}>
              Precio
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              {formattedPrice} ETH
            </div>
          </div>

          <div style={{
            padding: '2vh 2vw',
            border: '1px solid #e8e8e8',
            background: seed ? '#f5f5f5' : '#fff',
            transition: 'all 0.3s ease'
          }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', color: '#666', marginBottom: '0.8vh' }}>
              Estado
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              {!isConnected ? 'conectar' : !seed ? 'seed' : selectedVideo ? 'listo' : 'video'}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: '5vw',
          alignItems: 'start',
          borderTop: '1px solid #000',
          paddingTop: '6vh'
        }}>
          {/* LEFT: SEED INPUT */}
          <div>
            <div style={{ marginBottom: '4vh' }}>
              <label htmlFor="seedPhrase">Tu Semilla</label>
              <p style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", color: '#666', marginBottom: '1.5vh' }}>
                Una palabra, frase o concepto que defina tu creación.
              </p>
              <input
                id="seedPhrase"
                type="text"
                placeholder="tu nombre, coordenadas, un recuerdo..."
                {...register('seedPhrase', { required: 'Requerido' })}
                style={{ fontSize: '1rem' }}
              />
              {seed && (
                <div style={{
                  marginTop: '1.5vh',
                  padding: '1.5vh 1.5vw',
                  background: '#f5f5f5',
                  border: '1px solid #e8e8e8',
                  fontSize: '0.8rem',
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: '#666',
                  wordBreak: 'break-all'
                }}>
                  <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', marginBottom: '0.5vh' }}>Hash generado</div>
                  {seed}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: VIDEO SELECT */}
          <div>
            <div style={{ marginBottom: '2vh' }}>
              <label>Selecciona Video</label>
              <p style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", color: '#666', marginBottom: '1.5vh' }}>
                Elige la composición que acompañará tu semilla.
              </p>
            </div>

            {videosLoading ? (
              <div style={{
                padding: '4vh 2vw',
                textAlign: 'center',
                color: '#666',
                fontFamily: "'Space Grotesk', sans-serif"
              }}>
                Cargando videos...
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '1.5vw'
              }}>
                {Object.keys(videos).map((videoName) => (
                  <button
                    key={videoName}
                    type="button"
                    onClick={() => setSelectedVideo(videoName)}
                    onMouseEnter={() => setHoveredVideo(videoName)}
                    onMouseLeave={() => setHoveredVideo(null)}
                    style={{
                      padding: '2vh 1.5vw',
                      border: selectedVideo === videoName ? '2px solid #000' : '1px solid #e8e8e8',
                      background: selectedVideo === videoName || hoveredVideo === videoName ? '#f5f5f5' : '#fff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: '0.85rem',
                      fontWeight: 300,
                      transition: 'all 0.3s ease',
                      color: '#000',
                      textTransform: 'capitalize'
                    }}
                  >
                    {videoName.replace(/\.mp4/, '').slice(0, 30)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* MESSAGES & BUTTON */}
        <div style={{ marginTop: '6vh', borderTop: '1px solid #000', paddingTop: '4vh' }}>
          {error && (
            <div className="message error" style={{ marginBottom: '2vh' }}>
              {error}
            </div>
          )}
          {mintError && (
            <div className="message error" style={{ marginBottom: '2vh' }}>
              {mintError.message || 'Error desconocido'}
            </div>
          )}
          {status && status !== 'idle' && (
            <div className="message info" style={{ marginBottom: '2vh' }}>
              Estado: {status}
              {hash && <div style={{ marginTop: '0.8vh', fontSize: '0.85rem', wordBreak: 'break-all' }}>TX: {hash}</div>}
            </div>
          )}
          {success && (
            <div className="message success" style={{ marginBottom: '2vh' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={Boolean(!isConnected || isPending || !seed || !selectedVideo || (seed && isSeedMinted))}
            className="btn-minimal"
            style={{
              width: '100%',
              padding: '1.2rem 2rem',
              fontSize: '0.8rem',
              marginTop: '2vh'
            }}
          >
            {isPending ? '⏳ Procesando...' : !isConnected ? 'Conecta tu wallet' : !seed ? 'Completa tu semilla' : !selectedVideo ? 'Elige un video' : 'Acuñar NFT'}
          </button>
        </div>
      </form>
    </div>
  )
}
