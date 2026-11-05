'use client'

import { useReputation, ReputationData } from '@/lib/hooks/useReputation'
import { useEvolutionLogger, formatEvolutionForDisplay } from '@/lib/hooks/useEvolutionLogger'

interface EvolutionPanelProps {
  tokenId?: string
  seed?: string
  showLog?: boolean
  compact?: boolean
}

export function EvolutionPanel({ tokenId, seed, showLog = true, compact = false }: EvolutionPanelProps) {
  const { reputation, loading, error, glitchIntensity, glitchMode } = useReputation()
  const { state, loadFromStorage, addEntry: _addEntry } = useEvolutionLogger()

  if (tokenId && seed && state.tokenId !== tokenId) {
    loadFromStorage(tokenId, seed)
  }

  if (compact) {
    return (
      <div style={{
        fontSize: '0.7rem',
        fontFamily: 'JetBrains Mono, monospace',
        color: '#888',
      }}>
        {loading ? (
          <span>Consultando reputación...</span>
        ) : error ? (
          <span style={{ color: '#ff4444' }}>Error: {error}</span>
        ) : reputation ? (
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>
              Reputación: <strong style={{ color: '#0066ff' }}>{reputation.average.toFixed(2)}</strong>
            </span>
            <span>
              Interacciones: <strong>{reputation.count}</strong>
            </span>
            <span>
              Glitch: <strong style={{ 
                color: glitchMode === 'high' ? '#ff4444' : 
                       glitchMode === 'medium' ? '#ffaa00' : '#44ff44' 
              }}>
                {glitchMode.toUpperCase()} ({(glitchIntensity * 100).toFixed(0)}%)
              </strong>
            </span>
          </div>
        ) : (
          <span>Sin datos de reputación</span>
        )}
      </div>
    )
  }

  return (
    <div style={{
      padding: '1rem',
      background: 'var(--surface-elevated, #1a1a1a)',
      borderRadius: '8px',
      fontFamily: 'JetBrains Mono, monospace',
    }}>
      <div style={{ marginBottom: '1rem' }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: '0.75rem', 
          color: '#888',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Estado de Evolución
        </h4>
      </div>

      {loading ? (
        <div style={{ color: '#666' }}>Consultando reputación on-chain...</div>
      ) : error ? (
        <div style={{ color: '#ff4444' }}>Error: {error}</div>
      ) : (
        <>
          <div style={{ marginBottom: '1rem' }}>
            <ReputationDisplay reputation={reputation} glitchMode={glitchMode} />
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            marginBottom: '1rem',
          }}>
            <StatBox 
              label="Intensidad Glitch" 
              value={`${(glitchIntensity * 100).toFixed(0)}%`}
              color={glitchMode === 'high' ? '#ff4444' : glitchMode === 'medium' ? '#ffaa00' : '#44ff44'}
            />
            <StatBox 
              label="Interacciones" 
              value={reputation?.count?.toString() || '0'}
              color="#0066ff"
            />
            <StatBox 
              label="Wallets" 
              value={reputation?.clients?.toString() || '0'}
              color="#888"
            />
          </div>

          {showLog && state.entries.length > 0 && (
            <div>
              <h5 style={{ 
                margin: '0 0 0.5rem 0', 
                fontSize: '0.65rem', 
                color: '#666',
                textTransform: 'uppercase',
              }}>
                Bitácora de Evolución
              </h5>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {formatEvolutionForDisplay(state.entries)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ReputationDisplay({ reputation, glitchMode }: { reputation: ReputationData | null, glitchMode: string }) {
  const avg = reputation?.average ?? 0
  const max = 10

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '0.25rem',
        fontSize: '0.7rem',
        color: '#888',
      }}>
        <span>Reputación On-Chain</span>
        <span style={{ color: '#0066ff' }}>{avg.toFixed(2)} / {max}</span>
      </div>
      <div style={{
        height: '4px',
        background: '#333',
        borderRadius: '2px',
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${(avg / max) * 100}%`,
          height: '100%',
          background: `linear-gradient(90deg, #0066ff, ${glitchMode === 'high' ? '#ff4444' : glitchMode === 'medium' ? '#ffaa00' : '#44ff44'})`,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: { label: string, value: string, color: string }) {
  return (
    <div style={{
      padding: '0.5rem',
      background: '#0a0a0a',
      borderRadius: '4px',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '0.6rem', color: '#666', marginBottom: '0.25rem' }}>
        {label}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 'bold', color }}>
        {value}
      </div>
    </div>
  )
}

export function useEvolutionData() {
  const { reputation, loading, error, glitchIntensity, glitchMode } = useReputation()
  const { state, loadFromStorage, addEntry, getEvolutionMetadata } = useEvolutionLogger()

  return {
    reputation,
    loading,
    error,
    glitchIntensity,
    glitchMode,
    evolutionLog: state.entries,
    addEvolutionEvent: addEntry,
    getEvolutionMetadata,
    loadFromStorage,
  }
}