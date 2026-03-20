'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useForm } from 'react-hook-form'
import { useMintNFT } from '@/lib/hooks/useContract'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { GenerativePreview } from '@/components/generative/GenerativePreview'
import { ethers } from 'ethers'

interface MintFormData {
  seedPhrase: string
}

export const MintCard = () => {
  const { isConnected, address } = useAccount()
  const { register, handleSubmit, watch } = useForm<MintFormData>()
  const [seed, setSeed] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)

  const { mint, isPending, isSuccess, hash, error: mintError, status } = useMintNFT()
  const composition = useGenerativeComposition(seed)

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
    if (isSuccess && hash) {
      setSuccess(`✓ VideoDanza acuñada exitosamente! TX: ${hash}`)
      // Redirect to Etherscan after 2 seconds
      const timer = setTimeout(() => {
        window.location.href = `https://sepolia.etherscan.io/tx/${hash}`
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isSuccess, hash])

  const onSubmit = async (_data: MintFormData) => {
    try {
      setError(null)
      setIsGeneratingMetadata(true)

      if (!isConnected) {
        setError('Conecta tu wallet para continuar')
        setIsGeneratingMetadata(false)
        return
      }

      if (!seed) {
        setError('Ingresa una semilla válida')
        setIsGeneratingMetadata(false)
        return
      }

      if (!composition) {
        setError('Generando composición...')
        setIsGeneratingMetadata(false)
        return
      }

      if (isSeedMinted) {
        setError('Esta semilla ya ha sido acuñada')
        setIsGeneratingMetadata(false)
        return
      }

      // Llamar al endpoint serverless para generar metadata
      console.log('Generating metadata on backend...', { seed, seedPhrase, composition })
      const response = await fetch('/api/mint-metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          seed,
          seedPhrase,
          composition,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate metadata')
      }

      const { metadataUrl } = await response.json()

      console.log('Metadata generated:', metadataUrl)
      console.log('Calling mint with metadata URI:', { seed, metadataUrl, mintPrice })

      // Call mint with metadata URI from backend
      await mint(seed, metadataUrl, mintPrice)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Error al acuñar')
    } finally {
      setIsGeneratingMetadata(false)
    }
  }

  const formattedPrice = mintPrice ? (Number(mintPrice) / 1e18).toFixed(3) : '0.001'
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

  return (
    <div style={{ marginBottom: '8vh' }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* STATUS BANNER */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr',
            gap: '1.5vw',
            marginBottom: '6vh',
            padding: '0',
          }}
        >
          <div
            style={{
              padding: '2vh 2vw',
              border: '1px solid #e8e8e8',
              background: isConnected ? '#f5f5f5' : '#fff',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: '700',
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '0.8vh',
              }}
            >
              Wallet
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              {isConnected ? shortAddress || 'Conectado' : 'Desconectado'}
            </div>
          </div>

          <div
            style={{
              padding: '2vh 2vw',
              border: '1px solid #e8e8e8',
              background: '#f5f5f5',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: '700',
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '0.8vh',
              }}
            >
              Red
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              Sepolia
            </div>
          </div>

          <div
            style={{
              padding: '2vh 2vw',
              border: '1px solid #e8e8e8',
              background: '#f5f5f5',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: '700',
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '0.8vh',
              }}
            >
              Precio
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              {formattedPrice} ETH
            </div>
          </div>

          <div
            style={{
              padding: '2vh 2vw',
              border: '1px solid #e8e8e8',
              background: seed && composition ? '#f5f5f5' : '#fff',
              transition: 'all 0.3s ease',
            }}
          >
            <div
              style={{
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                fontWeight: '700',
                letterSpacing: '1px',
                color: '#666',
                marginBottom: '0.8vh',
              }}
            >
              Estado
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: '500', fontFamily: "'Space Grotesk', sans-serif" }}>
              {!isConnected ? 'conectar' : !seed ? 'semilla' : 'listo'}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT: FORM + PREVIEW */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '3vw',
            marginBottom: '6vh',
          }}
        >
          {/* LEFT: FORM */}
          <div>
            {/* SEED INPUT */}
            <div style={{ marginBottom: '3vh' }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: '1vh',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  color: '#666',
                }}
              >
                Tu semilla única
              </label>
              <input
                type="text"
                placeholder="ej: mi-semilla-única-2026"
                {...register('seedPhrase')}
                style={{
                  width: '100%',
                  padding: '1.2rem 1rem',
                  fontSize: '0.95rem',
                  border: '1px solid #e8e8e8',
                  fontFamily: "'Space Grotesk', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* INFO SECTION */}
            <div style={{ borderTop: '1px solid #e8e8e8', paddingTop: '2vh' }}>
              <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: '1.6', marginBottom: '2vh' }}>
                <strong>Cómo funciona:</strong> Tu semilla es hasheada criptográficamente. El mismo seed siempre produce
                la misma composición de videodanza, garantizando que tu NFT sea único e irreproducible.
              </p>

              {seed && (
                <div
                  style={{
                    padding: '1.5vh 1.5vw',
                    background: '#f5f5f5',
                    border: '1px solid #e8e8e8',
                    fontSize: '0.8rem',
                    fontFamily: "'Space Grotesk', sans-serif",
                    color: '#666',
                    wordBreak: 'break-all',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      fontWeight: '700',
                      letterSpacing: '1px',
                      marginBottom: '0.5vh',
                    }}
                  >
                    Identificador único
                  </div>
                  {seed}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: GENERATIVE PREVIEW */}
          <GenerativePreview composition={composition} isLoading={Boolean(seed && !composition)} />
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
              {hash && (
                <div style={{ marginTop: '0.8vh', fontSize: '0.85rem', wordBreak: 'break-all' }}>
                  TX: {hash}
                </div>
              )}
            </div>
          )}
          {success && (
            <div className="message success" style={{ marginBottom: '2vh' }}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={Boolean(!isConnected || isPending || isGeneratingMetadata || !seed || !composition || (seed && isSeedMinted))}
            className="btn-minimal"
            style={{
              width: '100%',
              padding: '1.2rem 2rem',
              fontSize: '0.8rem',
              marginTop: '2vh',
            }}
          >
            {isGeneratingMetadata
              ? '⏳ Generando metadata...'
              : isPending
                ? '⏳ Acuñando...'
                : !isConnected
                  ? 'Conecta tu wallet'
                  : !seed
                    ? 'Completa tu semilla'
                    : !composition
                      ? 'Generando...'
                      : 'Acuñar VideoDanza'}
          </button>
        </div>
      </form>
    </div>
  )
}
