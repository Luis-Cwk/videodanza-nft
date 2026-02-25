'use client'

import { useMemo } from 'react'
import { GenerativeComposition } from '@/lib/hooks/useGenerativeComposition'

interface GenerativePreviewProps {
  composition: GenerativeComposition | null
  isLoading?: boolean
}

export const GenerativePreview = ({ composition, isLoading = false }: GenerativePreviewProps) => {
  const previewStyle = useMemo(() => {
    if (!composition) return {}

    const hueRotate = composition.colorShift
    const filters = [
      `hue-rotate(${hueRotate}deg)`,
      `contrast(${0.8 + composition.audioIntensity * 0.3})`,
      `brightness(${0.9 + composition.backgroundIntensity * 0.2})`,
    ]

    return {
      background: `linear-gradient(135deg, hsla(${hueRotate}, 70%, 50%, ${composition.backgroundIntensity * 0.3}), hsla(${hueRotate + 60}, 60%, 45%, ${composition.backgroundIntensity * 0.2}))`,
      filter: filters.join(' '),
      aspectRatio: '16 / 9',
    }
  }, [composition])

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
          overflow: 'hidden',
          position: 'relative',
          ...previewStyle,
        }}
      >
        {!composition || isLoading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: '#999',
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: '0.95rem',
            }}
          >
            {isLoading ? 'Generando composición...' : 'Ingresa una semilla para ver preview'}
          </div>
        ) : (
          <>
            {/* Visual representation of composition */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
              }}
            >
              {composition.elements.map((element, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${element.positionX}%`,
                    top: `${element.positionY}%`,
                    width: `${20 * element.scale}%`,
                    aspectRatio: '1',
                    background: `hsla(${(idx * 120 + composition.colorShift) % 360}, 60%, 50%, ${element.opacity})`,
                    transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
                    borderRadius: '4px',
                    mixBlendMode: (element.blendMode as any) || 'normal',
                    opacity: element.opacity,
                    animation: `float-${idx % 2} 3s ease-in-out infinite`,
                  }}
                />
              ))}
            </div>

            {/* Composition info overlay */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'linear-gradient(transparent, rgba(0,0,0,0.4))',
                padding: '2vh 2vw',
                color: '#fff',
              }}
            >
              <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5vh' }}>
                {composition.theme}
              </div>
              <div style={{ fontSize: '0.8rem', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 300 }}>
                {composition.elements.length} capas • {composition.totalDuration.toFixed(1)}s • Hash: {composition.hash}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Composition details */}
      {composition && (
        <div style={{ marginTop: '2vh', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1vw' }}>
          {composition.elements.map((element, idx) => (
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
              <div style={{ fontWeight: 600, marginBottom: '0.3vh', fontSize: '0.65rem' }}>L{idx + 1}</div>
              <div style={{ color: '#666', fontSize: '0.65rem', marginBottom: '0.3vh' }}>
                {element.videoName.slice(0, 15)}...
              </div>
              <div style={{ color: '#999', fontSize: '0.6rem' }}>
                {element.duration.toFixed(1)}s • {Math.round(element.scale * 100)}%
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes float-0 {
          0%, 100% { transform: translateY(0px) rotate(var(--rotation)); }
          50% { transform: translateY(-10px) rotate(var(--rotation)); }
        }
        @keyframes float-1 {
          0%, 100% { transform: translateY(-10px) rotate(var(--rotation)); }
          50% { transform: translateY(0px) rotate(var(--rotation)); }
        }
      `}</style>
    </div>
  )
}
