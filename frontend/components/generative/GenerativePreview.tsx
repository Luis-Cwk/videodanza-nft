'use client'

import { GenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { VideodanzaPlayer } from '@/components/player/VideodanzaPlayer'

interface GenerativePreviewProps {
  composition: GenerativeComposition | null
  isLoading?: boolean
}

export const GenerativePreview = ({ composition, isLoading = false }: GenerativePreviewProps) => {
  if (!composition || isLoading) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        color: 'var(--text-muted)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.85rem',
        border: '1px solid var(--border-bright)',
      }}>
        <div style={{ textAlign: 'center', padding: '1rem' }}>
          <div style={{ marginBottom: '0.5rem', color: 'var(--accent)', opacity: 0.5 }}>◈</div>
          {isLoading ? 'Generando composición...' : 'Ingresa una semilla para ver preview'}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* VIDEO HERO - ancho completo */}
      <div style={{ 
        position: 'relative', 
        width: '100%',
        aspectRatio: '16/9',
        background: '#000',
        border: '1px solid var(--border-bright)',
      }}>
        <VideodanzaPlayer 
          elements={composition.elements} 
          autoPlay={true}
          muted={false}
          hoverSound={true}
        />
        
        {/* Info overlay */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
            padding: '1rem',
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {composition.theme}
          </div>
          <div style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)', marginTop: '0.3rem' }}>
            {composition.elements.length} capas • {composition.totalDuration.toFixed(1)}s
          </div>
        </div>
      </div>

      {/* SEMILLA - justo debajo del video */}
      <div style={{ 
        padding: '1.5rem 0',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '0.5rem' }}>
          Semilla
        </div>
        <div style={{ 
          fontSize: '1.2rem', 
          fontWeight: 700, 
          color: 'var(--text)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          {composition.seed}
        </div>
      </div>

      {/* CAPAS */}
      {composition.elements.length > 0 && (
        <div style={{ padding: '1.5rem 0', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '1rem' }}>
            Capas ({composition.elements.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {composition.elements.slice(0, 6).map((element, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                fontSize: '0.75rem',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                <div>
                  <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Capa {idx + 1}</span>
                  <span style={{ color: 'var(--text-dim)', marginLeft: '0.5rem' }}>{element.videoName}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', textAlign: 'right' }}>
                  {element.blendMode} • {Math.round(element.opacity * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PRECIO + ESTADO */}
      <div style={{ 
        padding: '1.5rem 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Precio</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>0.001 ETH</div>
        </div>
        <div>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Estado</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#00ff88', textTransform: 'uppercase' }}>LISTO</div>
        </div>
      </div>
    </div>
  )
}