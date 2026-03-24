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
        border: '1px solid var(--border-bright)',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface)',
        color: 'var(--text-muted)',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.85rem',
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
      <div style={{ position: 'relative', border: '1px solid var(--border-bright)' }}>
        <VideodanzaPlayer 
          elements={composition.elements} 
          autoPlay={true}
          muted={false}
          hoverSound={true}
        />
        
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
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem', color: 'var(--accent)' }}>
            {composition.theme}
          </div>
          <div style={{ fontSize: '0.7rem', fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-dim)' }}>
            {composition.elements.length} capas • {composition.totalDuration.toFixed(1)}s • {composition.hash.slice(0, 8)}...
          </div>
        </div>
      </div>

      {composition.elements.length > 0 && (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
          gap: '1px',
          background: 'var(--border)',
          border: '1px solid var(--border-bright)',
          marginTop: '1px',
        }}>
          {composition.elements.slice(0, 6).map((element, idx) => (
            <div
              key={idx}
              style={{
                padding: '0.8rem',
                background: 'var(--surface)',
                fontSize: '0.65rem',
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.3rem', color: 'var(--text)' }}>Capa {idx + 1}</div>
              <div style={{ color: 'var(--text-muted)', marginBottom: '0.3rem', wordBreak: 'break-word' }}>
                {element.videoName.slice(0, 12)}..
              </div>
              <div style={{ color: 'var(--accent)', fontSize: '0.6rem' }}>
                {element.blendMode} • {Math.round(element.opacity * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
