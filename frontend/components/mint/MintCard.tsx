'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { useForm } from 'react-hook-form'
import { useMintNFT } from '@/lib/hooks/useContract'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { GenerativePreview } from '@/components/generative/GenerativePreview'
import { ethers } from 'ethers'

interface MintFormData {
  seedPhrase: string
}

const CONTRACT_ADDRESS = '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828'
const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com'

const CONTRACT_ABI = [
  'function isSeedMinted(bytes32) view returns (bool)'
]

export const MintCard = () => {
  const { isConnected, address } = useAccount()
  const { register, handleSubmit, watch, reset } = useForm<MintFormData>()
  const [seed, setSeed] = useState<`0x${string}` | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)
  const [isSeedMinted, setIsSeedMinted] = useState(false)
  const [checkingSeed, setCheckingSeed] = useState(false)

  const { mint, isPending, isSuccess, hash, error: mintError, status } = useMintNFT()
  const composition = useGenerativeComposition(seed)

  const seedPhrase = watch('seedPhrase')
  const mintPrice = '1000000000000000'

  const checkIfSeedMinted = useCallback(async (seedValue: `0x${string}`) => {
    try {
      setCheckingSeed(true)
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const minted = await contract.isSeedMinted(seedValue)
      setIsSeedMinted(minted)
    } catch (err) {
      console.warn('Error checking seed:', err)
      setIsSeedMinted(false)
    } finally {
      setCheckingSeed(false)
    }
  }, [])

  useEffect(() => {
    if (seedPhrase && typeof seedPhrase === 'string' && seedPhrase.trim()) {
      try {
        const hashedSeed = ethers.keccak256(ethers.toUtf8Bytes(seedPhrase))
        setSeed(hashedSeed as `0x${string}`)
        setIsSeedMinted(false)
      } catch (err) {
        setSeed(null)
      }
    } else {
      setSeed(null)
      setIsSeedMinted(false)
    }
  }, [seedPhrase])

  useEffect(() => {
    if (seed) {
      checkIfSeedMinted(seed)
    }
  }, [seed, checkIfSeedMinted])

  useEffect(() => {
    if (isSuccess && hash) {
      setSuccess(`VideoDanza acuanada! TX: ${hash.slice(0, 10)}...`)
      setIsSeedMinted(true)
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
        setError('Ingresa una semilla valida')
        setIsGeneratingMetadata(false)
        return
      }

      if (!composition) {
        setError('Generando composicion...')
        setIsGeneratingMetadata(false)
        return
      }

      if (isSeedMinted) {
        setError('Esta semilla ya ha sido acuñada')
        setIsGeneratingMetadata(false)
        return
      }

      const response = await fetch('/api/mint-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, seedPhrase, composition }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate metadata')
      }

      const { metadataUrl } = await response.json()
      await mint(seed, metadataUrl, mintPrice)
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Error al acuñar')
    } finally {
      setIsGeneratingMetadata(false)
    }
  }

  const handleReset = () => {
    reset()
    setSeed(null)
    setIsSeedMinted(false)
    setSuccess(null)
    setError(null)
  }

  const formattedPrice = mintPrice ? (Number(mintPrice) / 1e18).toFixed(3) : '0.001'
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : null

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-item">
          <div className="stat-label">Wallet</div>
          <div className="stat-value" style={{ fontSize: '0.9rem', color: isConnected ? 'var(--accent)' : 'var(--text-muted)' }}>
            {isConnected ? shortAddress || 'Conectado' : 'Desconectado'}
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Red</div>
          <div className="stat-value" style={{ fontSize: '0.9rem' }}>SEPOLIA</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Precio</div>
          <div className="stat-value" style={{ fontSize: '0.9rem' }}>{formattedPrice} ETH</div>
        </div>

        <div className="stat-item">
          <div className="stat-label">Estado</div>
          <div className="stat-value" style={{ fontSize: '0.9rem', color: isSeedMinted ? '#ff4444' : (seed && composition ? 'var(--accent)' : 'var(--text-muted)') }}>
            {checkingSeed ? 'CHECK...' : isSeedMinted ? 'TOMADO' : (!isConnected ? 'CONECTAR' : !seed ? 'SEMILLA' : !composition ? 'GENERANDO' : 'LISTO')}
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1px',
        background: 'var(--border)',
        border: '1px solid var(--border-bright)',
        marginBottom: '2rem',
      }}>
        <div style={{ padding: '1.5rem', background: 'var(--bg)' }}>
          <label>Tu semilla unica</label>
          <input
            type="text"
            placeholder="ej: mi-semilla-unica-2026"
            {...register('seedPhrase')}
          />

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
              <strong>Como funciona:</strong> Tu semilla es hasheada criptograficamente. El mismo seed siempre produce la misma composicion.
            </p>

            {seed && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'var(--surface)',
                border: '1px solid var(--border-bright)',
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: isSeedMinted ? '#ff4444' : 'var(--text-muted)',
                wordBreak: 'break-all',
              }}>
                <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem', color: 'var(--text-dim)' }}>
                  Identificador {isSeedMinted && '(YA MINTEADO)'}
                </div>
                {seed}
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: '1.5rem', background: 'var(--surface)' }}>
          <div className="data-panel-label" data-coord="PREVIEW.001">Vista Previa</div>
          <div style={{ marginTop: '1rem' }}>
            <GenerativePreview composition={composition} isLoading={Boolean(seed && !composition)} />
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border-bright)', paddingTop: '1.5rem' }}>
        {error && <div className="message error">{error}</div>}
        {mintError && <div className="message error">{mintError.message || 'Error desconocido'}</div>}
        {status && status !== 'idle' && (
          <div className="message info">
            Estado: {status}
            {hash && <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', wordBreak: 'break-all' }}>TX: {hash}</div>}
          </div>
        )}
        {success && (
          <div className="message success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              {success}
              {hash && (
                <a 
                  href={`https://sepolia.etherscan.io/tx/${hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--accent)', textDecoration: 'underline' }}
                >
                  Ver en Etherscan ↗
                </a>
              )}
            </div>
            <button
              type="button"
              onClick={handleReset}
              style={{
                background: 'transparent',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                padding: '0.5rem 1rem',
                cursor: 'pointer',
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              Mintear otra →
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={Boolean(!isConnected || isPending || isGeneratingMetadata || !seed || !composition || isSeedMinted || checkingSeed)}
          className="btn-fui btn-fui-primary"
          style={{ width: '100%', marginTop: '1rem' }}
        >
          {isGeneratingMetadata
            ? 'Generando metadata...'
            : isPending
              ? 'Acuñando...'
              : !isConnected
                ? 'Conecta tu wallet'
                : !seed
                  ? 'Completa tu semilla'
                  : !composition
                    ? 'Generando...'
                    : isSeedMinted
                      ? 'Semilla ya minteada'
                      : 'Acuñar VideoDanza'}
        </button>
      </div>
    </form>
  )
}