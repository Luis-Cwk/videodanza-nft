'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { ethers } from 'ethers'
import { useMintNFT } from '@/lib/hooks/useContract'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { GenerativePreview } from '@/components/generative/GenerativePreview'

interface CompositionPanelProps {
  suggestedSeed: string | null
  onSeedChange?: (seed: string | null) => void
}

const CONTRACT_ADDRESS = '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828'
const SEPOLIA_RPC = 'https://ethereum-sepolia.publicnode.com'
const CONTRACT_ABI = ['function isSeedMinted(bytes32) view returns (bool)']

export function CompositionPanel({ suggestedSeed, onSeedChange }: CompositionPanelProps) {
  const { isConnected } = useAccount()
  const [seedPhrase, setSeedPhrase] = useState<string>('')
  const [seedHash, setSeedHash] = useState<`0x${string}` | null>(null)
  const [isSeedMinted, setIsSeedMinted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)

  const { mint, isPending, isSuccess, hash, error: mintError } = useMintNFT()
  const composition = useGenerativeComposition(seedHash)

  const checkIfSeedMinted = useCallback(async (s: `0x${string}`) => {
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC)
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)
      const minted = await contract.isSeedMinted(s)
      setIsSeedMinted(minted)
    } catch {
      setIsSeedMinted(false)
    }
  }, [])

  // When suggested seed changes from agent
  useEffect(() => {
    if (suggestedSeed && suggestedSeed !== seedPhrase) {
      setSeedPhrase(suggestedSeed)
    }
  }, [suggestedSeed])

  // Hash the seed phrase when it changes
  useEffect(() => {
    if (seedPhrase?.trim()) {
      try {
        const hashed = ethers.keccak256(ethers.toUtf8Bytes(seedPhrase.trim()))
        setSeedHash(hashed as `0x${string}`)
        setIsSeedMinted(false)
        onSeedChange?.(hashed)
      } catch {
        setSeedHash(null)
      }
    } else {
      setSeedHash(null)
      setIsSeedMinted(false)
    }
  }, [seedPhrase])

  // Check if seed is already minted
  useEffect(() => {
    if (seedHash) checkIfSeedMinted(seedHash)
  }, [seedHash, checkIfSeedMinted])

  // Handle success
  useEffect(() => {
    if (isSuccess && hash) {
      setSuccess(`VideoDanza acunada! TX: ${hash.slice(0, 10)}...`)
    }
  }, [isSuccess, hash])

  const handleMint = async () => {
    try {
      setError(null)
      setIsGeneratingMetadata(true)

      if (!isConnected) {
        setError('Conecta tu wallet para continuar')
        setIsGeneratingMetadata(false)
        return
      }
      if (!seedHash || !composition) {
        setError('Genera una composicion primero')
        setIsGeneratingMetadata(false)
        return
      }
      if (isSeedMinted) {
        setError('Esta semilla ya fue acunada')
        setIsGeneratingMetadata(false)
        return
      }

      const response = await fetch('/api/mint-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed: seedHash, seedPhrase, composition }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate metadata')
      }

      const { metadataUrl } = await response.json()
      await mint(seedHash, metadataUrl, '1000000000000000')
    } catch (err: any) {
      setError(err.message || 'Error al acunar')
    } finally {
      setIsGeneratingMetadata(false)
    }
  }

  const handleReset = () => {
    setSeedPhrase('')
    setSeedHash(null)
    setIsSeedMinted(false)
    setSuccess(null)
    setError(null)
  }

  const canMint = isConnected && seedHash && composition && !isSeedMinted && !isPending

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', height: '100%',
      border: '1px solid var(--border-bright)', background: 'var(--bg)',
    }}>
      {/* Header */}
      <div style={{
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div>
          <div style={{
            fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '2px',
            color: 'var(--text-muted)', marginBottom: '0.25rem',
          }}>
            COMPOSICION
          </div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)' }}>
            Vista Previa
          </div>
        </div>
        {seedPhrase && (
          <button onClick={handleReset} style={{
            background: 'transparent', border: '1px solid var(--border)',
            color: 'var(--text-muted)', padding: '0.3rem 0.6rem', cursor: 'pointer',
            fontSize: '0.65rem', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace",
          }}>
            Reset
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {/* Seed display */}
        {seedPhrase && (
          <div style={{
            padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border)',
            background: 'var(--surface)',
          }}>
            <div style={{
              fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '1px',
              color: 'var(--text-dim)', marginBottom: '0.3rem',
            }}>
              Semilla
            </div>
            <div style={{
              fontSize: '0.8rem', fontFamily: "'JetBrains Mono', monospace",
              color: isSeedMinted ? '#ff4444' : 'var(--accent)',
              wordBreak: 'break-all',
            }}>
              {seedPhrase}
            </div>
            {seedHash && (
              <div style={{
                fontSize: '0.6rem', fontFamily: "'JetBrains Mono', monospace",
                color: 'var(--text-muted)', marginTop: '0.3rem', wordBreak: 'break-all',
              }}>
                {seedHash}
              </div>
            )}
          </div>
        )}

        {/* Preview */}
        <div style={{ padding: '1.25rem' }}>
          <GenerativePreview composition={composition} isLoading={Boolean(seedHash && !composition)} />
        </div>

        {/* Status */}
        {!seedPhrase && (
          <div style={{
            padding: '2rem 1.25rem', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: '0.8rem',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem', opacity: 0.3 }}>◈</div>
            Habla con el agente para generar tu composicion
          </div>
        )}
      </div>

      {/* Footer: Status + Mint */}
      <div style={{
        padding: '1rem 1.25rem', borderTop: '1px solid var(--border)',
        background: 'var(--surface)',
      }}>
        {/* Status grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: '0.5rem', marginBottom: '1rem',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              Wallet
            </div>
            <div style={{ fontSize: '0.75rem', color: isConnected ? 'var(--accent)' : 'var(--text-muted)', fontWeight: 600 }}>
              {isConnected ? 'CONECTADO' : 'DESCONECTADO'}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              Semilla
            </div>
            <div style={{
              fontSize: '0.75rem', fontWeight: 600,
              color: isSeedMinted ? '#ff4444' : (seedHash ? 'var(--accent)' : 'var(--text-muted)'),
            }}>
              {isSeedMinted ? 'MINT' : (seedHash ? 'LISTA' : 'VACIA')}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.55rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>
              Precio
            </div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
              0.001 ETH
            </div>
          </div>
        </div>

        {/* Messages */}
        {(error || mintError) && (
          <div style={{
            padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
            background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.3)',
            fontSize: '0.7rem', color: '#ff4444', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {error || mintError?.message}
          </div>
        )}
        {success && (
          <div style={{
            padding: '0.5rem 0.75rem', marginBottom: '0.75rem',
            background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)',
            fontSize: '0.7rem', color: '#00ff88', fontFamily: "'JetBrains Mono', monospace",
          }}>
            {success}
            {hash && (
              <a href={`https://sepolia.etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'block', marginTop: '0.3rem', color: 'var(--accent)', textDecoration: 'underline' }}>
                Ver en Etherscan
              </a>
            )}
          </div>
        )}

        {/* Mint button */}
        <button
          onClick={handleMint}
          disabled={!canMint || isGeneratingMetadata}
          style={{
            width: '100%', padding: '0.85rem',
            background: canMint && !isGeneratingMetadata ? 'var(--accent)' : 'var(--surface)',
            color: canMint && !isGeneratingMetadata ? '#000' : 'var(--text-muted)',
            border: '1px solid var(--accent)',
            cursor: canMint && !isGeneratingMetadata ? 'pointer' : 'not-allowed',
            fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '1px',
            transition: 'all 0.2s',
          }}
        >
          {isGeneratingMetadata ? 'Generando metadata...' :
           isPending ? 'Acunando...' :
           !isConnected ? 'Conecta tu wallet' :
           !seedHash ? 'Esperando semilla...' :
           isSeedMinted ? 'Semilla ya acunada' :
           'Acunar VideoDanza'}
        </button>
      </div>
    </div>
  )
}
