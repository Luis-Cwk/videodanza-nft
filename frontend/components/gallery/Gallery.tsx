'use client'

import { useState, useMemo } from 'react'
import { ethers } from 'ethers'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'

export const Gallery = () => {
  // Generate some example seeds to showcase generative compositions
  const exampleSeeds = useMemo(() => {
    return [
      'flowing in silence',
      'digital gardens',
      'echo chambers',
      'crystalline dreams',
      'velocity of thought',
      'urban movements',
      'sacred geometries',
      'temporal fragmentation',
    ]
  }, [])

  const [selectedComposition, setSelectedComposition] = useState<any>(null)

  // Generate hash for each example seed
  const exampleCompositions = useMemo(() => {
    return exampleSeeds.map((phrase) => {
      const hashedSeed = ethers.keccak256(ethers.toUtf8Bytes(phrase))
      return {
        phrase,
        seed: hashedSeed as `0x${string}`,
      }
    })
  }, [exampleSeeds])

  const handleSelectComposition = (composition: any) => {
    setSelectedComposition(composition)
  }

  return (
    <main>
      {/* HEADER */}
      <section style={{ marginBottom: '8vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h1 style={{ marginBottom: '3vh' }}>GALERÍA GENERATIVA</h1>
        <p className="intro">
          Explorar composiciones generadas por diferentes semillas.
          Cada una es única, determinística y verificable. Estas son ejemplos de lo que tu semilla podría generar.
        </p>
      </section>

      {/* COMPOSITION GRID */}
      <section style={{ marginBottom: '12vh' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '2vw'
        }}>
          {exampleCompositions.map((composition, idx) => (
            <GenerativeCard
              key={idx}
              composition={composition}
              onSelect={() => handleSelectComposition(composition)}
            />
          ))}
        </div>
      </section>

      {/* DETAIL MODAL */}
      {selectedComposition && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '2vw'
        }}>
          <div style={{
            background: '#fff',
            border: '1px solid #000',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <button
              onClick={() => setSelectedComposition(null)}
              style={{
                position: 'sticky',
                top: 0,
                right: 0,
                background: '#fff',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                padding: '1rem',
                zIndex: 101
              }}
            >
              ✕
            </button>

            <CompositionDetail composition={selectedComposition} />
          </div>
        </div>
      )}
    </main>
  )
}

interface GenerativeCardProps {
  composition: { phrase: string; seed: `0x${string}` }
  onSelect: () => void
}

const GenerativeCard = ({ composition, onSelect }: GenerativeCardProps) => {
  const generativeComposition = useGenerativeComposition(composition.seed)

  return (
    <div
      onClick={onSelect}
      style={{
        border: '1px solid #e8e8e8',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#000'
        el.style.transform = 'translateY(-4px)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = '#e8e8e8'
        el.style.transform = 'translateY(0)'
      }}
    >
      {/* PREVIEW */}
      <div
        style={{
          aspectRatio: '1',
          background: generativeComposition
            ? `linear-gradient(135deg, hsla(${generativeComposition.colorShift}, 70%, 50%, ${generativeComposition.backgroundIntensity * 0.3}), hsla(${generativeComposition.colorShift + 60}, 60%, 45%, ${generativeComposition.backgroundIntensity * 0.2}))`
            : '#f5f5f5',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {generativeComposition && (
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {generativeComposition.theme}
            </div>
            <div style={{ fontSize: '1.2rem', marginTop: '1vh' }}>
              {generativeComposition.elements.length} capas
            </div>
          </div>
        )}
      </div>

      {/* INFO */}
      <div style={{ padding: '2vh 2vw' }}>
        <h3
          style={{
            fontSize: '1rem',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            marginBottom: '0.8vh',
            lineHeight: 1.2,
          }}
        >
          {composition.phrase}
        </h3>
        <p
          style={{
            fontSize: '0.8rem',
            fontFamily: "'Space Grotesk', sans-serif",
            color: '#666',
            fontWeight: 300,
          }}
        >
          {generativeComposition ? `${generativeComposition.totalDuration.toFixed(1)}s` : 'Cargando...'}
        </p>
      </div>
    </div>
  )
}

interface CompositionDetailProps {
  composition: { phrase: string; seed: `0x${string}` }
}

const CompositionDetail = ({ composition }: CompositionDetailProps) => {
  const generativeComposition = useGenerativeComposition(composition.seed)

  if (!generativeComposition) {
    return (
      <div style={{ padding: '4vh 4vw', textAlign: 'center' }}>
        Generando composición...
      </div>
    )
  }

  return (
    <div style={{ padding: '4vh 4vw' }}>
      <h2 style={{ marginBottom: '2vh' }}>"{composition.phrase}"</h2>

      {/* VISUALIZATION */}
      <div
        style={{
          aspectRatio: '16 / 9',
          background: `linear-gradient(135deg, hsla(${generativeComposition.colorShift}, 70%, 50%, ${generativeComposition.backgroundIntensity * 0.3}), hsla(${generativeComposition.colorShift + 60}, 60%, 45%, ${generativeComposition.backgroundIntensity * 0.2}))`,
          border: '1px solid #e8e8e8',
          position: 'relative',
          marginBottom: '4vh',
          overflow: 'hidden',
        }}
      >
        {generativeComposition.elements.map((element, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              left: `${element.positionX}%`,
              top: `${element.positionY}%`,
              width: `${20 * element.scale}%`,
              aspectRatio: '1',
              background: `hsla(${(idx * 120 + generativeComposition.colorShift) % 360}, 60%, 50%, ${element.opacity})`,
              transform: `rotate(${element.rotation}deg) scale(${element.scale})`,
              borderRadius: '4px',
              mixBlendMode: (element.blendMode as any) || 'normal',
              opacity: element.opacity,
            }}
          />
        ))}
      </div>

      {/* SPEC GRID */}
      <div style={{ marginBottom: '4vh' }}>
        <h3 style={{ marginBottom: '2vh' }}>Parámetros Generados</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Tema</div>
            <div className="stat-value" style={{ textTransform: 'capitalize' }}>
              {generativeComposition.theme}
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Duración</div>
            <div className="stat-value">{generativeComposition.totalDuration.toFixed(1)}s</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Capas</div>
            <div className="stat-value">{generativeComposition.elements.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Intensidad BG</div>
            <div className="stat-value">{Math.round(generativeComposition.backgroundIntensity * 100)}%</div>
          </div>
        </div>
      </div>

      {/* ELEMENTS */}
      <div style={{ marginBottom: '4vh' }}>
        <h3 style={{ marginBottom: '2vh' }}>Capas Generadas</h3>
        <div style={{ display: 'grid', gap: '1.5vw' }}>
          {generativeComposition.elements.map((element, idx) => (
            <div key={idx} style={{ border: '1px solid #e8e8e8', padding: '2vh 2vw' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1vw' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>
                    Capa {idx + 1}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {element.videoName.slice(0, 20)}...
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>
                    Duración
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{element.duration.toFixed(1)}s</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>
                    Escala
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{Math.round(element.scale * 100)}%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>
                    Blend
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{element.blendMode}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>
                    Rotación
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{Math.round(element.rotation)}°</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '0.5vh' }}>
                    Opacidad
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>{Math.round(element.opacity * 100)}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SEED INFO */}
      <div style={{ borderTop: '1px solid #000', paddingTop: '3vh' }}>
        <h3 style={{ marginBottom: '2vh' }}>Información del Seed</h3>
        <div style={{
          padding: '2vh 2vw',
          background: '#f5f5f5',
          border: '1px solid #e8e8e8',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '0.85rem',
          wordBreak: 'break-all'
        }}>
          <div style={{ marginBottom: '1vh' }}>
            <strong>Semilla original:</strong> "{composition.phrase}"
          </div>
          <div>
            <strong>Hash (0x...):</strong> {composition.seed}
          </div>
        </div>
      </div>
    </div>
  )
}
