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
  const { isConnected } = useAccount()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MintFormData>()
  const [seed, setSeed] = useState<`0x${string}` | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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
      setSuccess(`NFT minted successfully! TX: ${hash}`)
      setTimeout(() => setSuccess(null), 5000)
    }
  }, [isSuccess, hash])

  const onSubmit = async (_data: MintFormData) => {
    try {
      setError(null)

      if (!isConnected) {
        setError('— Por favor conecta tu wallet primero')
        return
      }

      if (!seed) {
        setError('— Ingresa una seed phrase válida')
        return
      }

      if (isSeedMinted) {
        setError('— Esta seed ya ha sido acuñada')
        return
      }

      if (!selectedVideo) {
        setError('— Selecciona un video')
        return
      }

      // Get the IPFS metadata URI for the selected video
      const videoData = videos[selectedVideo]
      if (!videoData) {
        setError('— No se encontró la metadata del video')
        return
      }

      // Use the IPFS URI (ipfs://Qm...) for the contract
      const metadataURI = videoData.ipfs
      if (!metadataURI) {
        setError('— No se encontró la URI IPFS del video')
        return
      }

      console.log('Calling mint with:', { seed, metadataURI, mintPrice })
      await mint(seed, metadataURI, mintPrice)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? `— ${err.message}` : '— Error al acuñar')
    }
  }

  const formattedPrice = mintPrice ? (Number(mintPrice) / 1e18).toFixed(4) : '0.001'

  return (
    <div className="mint-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit(onSubmit)} className="mint-form" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '4vw', alignItems: 'start' }}>
        {/* COLUMNA IZQUIERDA: Información */}
        <div className="mint-info">
          <h2 style={{ fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '20px' }}>
            Mint Your VideoDanza
          </h2>

          <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.95rem', fontWeight: '300', marginBottom: '15px' }}>
            Cada seed genera una composición única y determinística. El mismo seed siempre produce el mismo video, permitiendo reproducibilidad y verificación en la cadena de bloques.
          </p>

          <div className="separator"></div>

          {/* Detalles */}
          <div style={{ marginTop: '30px' }}>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Red</span>
              <span>Sepolia Testnet</span>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Precio</span>
              <span>{formattedPrice} ETH</span>
            </div>
            <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Royalties</span>
              <span>7.5%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold' }}>Estado</span>
              <span>
                {!isConnected ? 'wallet no conectado' : !seed ? 'ingresa seed' : 'listo'}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: Formulario */}
        <div className="mint-form-inputs">
          {/* Conectar Wallet */}
          {!isConnected && (
            <div className="message info">
              Conecta tu wallet para continuar
            </div>
          )}

          {/* Seed Phrase Input */}
          <div style={{ marginBottom: '25px' }}>
            <label htmlFor="seedPhrase">Seed Phrase</label>
            <input
              id="seedPhrase"
              type="text"
              placeholder="Tu nombre, coordenadas, un recuerdo..."
              {...register('seedPhrase', { required: 'Requerido' })}
            />
            {errors.seedPhrase && (
              <div className="message error" style={{ marginTop: '5px', fontSize: '0.75rem' }}>
                {errors.seedPhrase.message}
              </div>
            )}
            {seed && (
              <div style={{ marginTop: '8px', fontSize: '0.75rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: '300', color: '#666' }}>
                Seed hash: {seed.slice(0, 16)}...
              </div>
            )}
          </div>

          <div className="separator"></div>

          {/* Video Selection */}
          <div style={{ marginTop: '25px', marginBottom: '25px' }}>
            <label htmlFor="video">Selecciona Video</label>
            {videosLoading ? (
              <div style={{ fontSize: '0.9rem', color: '#666' }}>Cargando videos...</div>
            ) : (
              <select
                id="video"
                value={selectedVideo}
                onChange={(e) => setSelectedVideo(e.target.value)}
              >
                <option value="">— Elige un video —</option>
                {Object.keys(videos).map((videoName) => (
                  <option key={videoName} value={videoName}>
                    {videoName.replace(/\.mp4/, '').slice(0, 50)}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="separator"></div>

          {/* Error/Success Messages */}
          {error && <div className="message error">{error}</div>}
          {mintError && <div className="message error">— {mintError.message || 'Error desconocido'}</div>}
          {status && status !== 'idle' && (
            <div className="message info">
              → Estado: {status}
              {hash && <div style={{ marginTop: '5px' }}>TX: {hash}</div>}
            </div>
          )}
          {success && <div className="message success">{success}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={Boolean(!isConnected || isPending || !seed || !selectedVideo || (seed && isSeedMinted))}
            className="btn-minimal"
            style={{ marginTop: '30px', width: '100%', padding: '12px 20px', textAlign: 'center' }}
          >
            {isPending ? '⏳ Procesando...' : !isConnected ? 'Conecta Wallet' : !seed ? 'Ingresa Seed' : !selectedVideo ? 'Elige Video' : 'Acuñar NFT'}
          </button>
        </div>
      </form>
    </div>
  )
}
