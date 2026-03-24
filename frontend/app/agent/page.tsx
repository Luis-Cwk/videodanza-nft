'use client'

import { useState, useEffect } from 'react'
import { CameraCapture } from '@/components/agent/CameraCapture'

const TimeDisplay = () => {
  const [time, setTime] = useState<string>('')
  useEffect(() => { setTime(Date.now().toString()) }, [])
  return <>{time}</>
}

export default function AgentPage() {
  const handleComplete = (videoBlob: Blob, cid: string) => {
    console.log('Video captured:', videoBlob.size, 'bytes')
    console.log('IPFS CID:', cid)
  }

  return (
    <main>
      <div className="page-content">
        {/* HERO */}
        <section className="hero-section">
          <h1>SOMAAGENT</h1>
          <p className="intro">
            Agente creativo autónomo. Graba tu movimiento, el agente analiza tu cuerpo,
            decide el estilo artístico, y crea una videodanza única. Todo en segundos.
          </p>
        </section>

        {/* CAPTURA */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="AGENT.001">
              Captura de Movimiento
            </div>
            <div style={{ marginTop: '1rem' }}>
              <CameraCapture onComplete={handleComplete} />
            </div>
          </div>
        </section>

        {/* CÓMO FUNCIONA */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="AGENT.002">
              Cómo Funciona el Agente
            </div>

            <div className="feature-grid" style={{ marginTop: '1.5rem' }}>
              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>01</div>
                <h3>Captura</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  La cámara captura tu movimiento. El agente registra cada gesto, cada ángulo, cada transición.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>02</div>
                <h3>Análisis</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  El agente analiza tu movimiento usando notación Laban. Detecta si golpeas, flotas, deslizas, cortas.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>03</div>
                <h3>Decisión</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  El agente decide el estilo artístico. No eliges tú. El cuerpo elige a través del movimiento.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>04</div>
                <h3>Creación</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  StreamDiffusion en GPU cloud transforma tu video con el estilo elegido por el agente.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>05</div>
                <h3>Permanencia</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Tu videodanza vive en IPFS. El NFT en Base. Tu cuerpo, para siempre en la cadena.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MAPA DE MOVIMIENTOS */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="AGENT.003">
              Mapa de Movimiento a Estilo
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1px',
              background: 'var(--border)',
              marginTop: '1.5rem',
            }}>
              {[
                { movement: 'Golpear', style: 'Aggressive', desc: 'Explosive energy, crimson reds', color: '#8B0000' },
                { movement: 'Flotar', style: 'Ethereal', desc: 'Soft ocean blues, dreamy', color: '#4169E1' },
                { movement: 'Deslizar', style: 'Elegant', desc: 'Smooth silver metallic', color: '#C0C0C0' },
                { movement: 'Cortar', style: 'Brutalist', desc: 'Angular monochrome', color: '#333' },
                { movement: 'Presionar', style: 'Heavy', desc: 'Dense dark matter, earth tones', color: '#8B4513' },
                { movement: 'Retorcer', style: 'Organic', desc: 'Twisted bioluminescent', color: '#006400' },
                { movement: 'Sacudir', style: 'Digital Chaos', desc: 'Electric neon glitch', color: '#FF00FF' },
                { movement: 'Tocar', style: 'Minimal', desc: 'Precise pointillism', color: '#000' },
              ].map(({ movement, style, desc, color }) => (
                <div key={movement} style={{
                  padding: '1.5rem',
                  background: 'var(--surface)',
                  borderLeft: `3px solid ${color}`,
                }}>
                  <div style={{ fontWeight: '700', marginBottom: '0.5rem', color: 'var(--text)' }}>{movement}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span className="text-accent">{style}</span>: {desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TELEMETRY */}
        <section className="mt-3" style={{ borderTop: '1px solid var(--border-bright)', paddingTop: '1rem' }}>
          <div className="telemetry">
            <span>MODE: AGENT</span>
            <span>│</span>
            <span>STATUS: READY</span>
            <span>│</span>
            <span>TIMESTAMP: </span><TimeDisplay />
          </div>
        </section>
      </div>
    </main>
  )
}
