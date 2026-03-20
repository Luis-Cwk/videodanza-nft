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
      <div style={{ marginTop: '4vh', marginBottom: '4vh' }}>
        <div style={{ marginBottom: '1.5vh' }}>
          <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', color: '#666' }}>
            Preview generativo
          </div>
        </div>
        <div
          style={{
            border: '1px solid #e8e8e8',
            aspectRatio: '3/4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#999',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '0.95rem',
          }}
        >
          {isLoading ? 'Generando composición...' : 'Ingresa una semilla para ver preview'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: '4vh', marginBottom: '4vh' }}>
      <div style={{ marginBottom: '1.5vh' }}>
        <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px', color: '#666' }}>
          Preview generativo
        </div>
      </div>

      <div style={{ position: 'relative', border: '1px solid #e8e8e8' }}>
        <VideodanzaPlayer 
          elements={composition.elements} 
          autoPlay={true}
          muted={true}
        />
        
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
            padding: '2vh 2vw',
            color: '#fff',
            zIndex: 100,
          }}
        >
          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5vh' }}>
            {composition.theme}
          </div>
          <div style={{ fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 300 }}>
            {composition.elements.length} capas • {composition.totalDuration.toFixed(1)}s • {composition.hash}
          </div>
        </div>
      </div>

      {composition.elements.length > 0 && (
        <div style={{ marginTop: '2vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1vw' }}>
          {composition.elements.slice(0, 6).map((element, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.2vh 1vw',
                border: '1px solid #e8e8e8',
                background: '#f5f5f5',
                fontSize: '0.7rem',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: '0.3vh', fontSize: '0.65rem' }}>Capa {idx + 1}</div>
              <div style={{ color: '#666', fontSize: '0.65rem', marginBottom: '0.3vh', wordBreak: 'break-word' }}>
                {element.videoName.slice(0, 15)}
              </div>
              <div style={{ color: '#999', fontSize: '0.6rem' }}>
                {element.blendMode} • {Math.round(element.opacity * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
