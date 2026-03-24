'use client'

import { useState, useEffect } from 'react'
import { MintCard } from '@/components/mint/MintCard'
import { useIPFSLookupTable } from '@/lib/hooks/useIPFS'

const TimeDisplay = () => {
  const [time, setTime] = useState<string>('')
  useEffect(() => { setTime(Date.now().toString()) }, [])
  return <>{time}</>
}

export default function MintPage() {
  const { videos } = useIPFSLookupTable()
  const videoCount = videos ? Object.keys(videos).length : 0

  return (
    <main>
      <div className="page-content">
        {/* HERO SECTION */}
        <section className="hero-section">
          <h1>CREAR NFT</h1>
          <p className="intro">
            Tu semilla genera una combinación única de {videoCount === 0 ? '5-25' : videoCount} videos. 
            Cada mint es una composición determinística, irreproducible y permanente en la cadena de bloques.
          </p>
        </section>

        {/* MINT FORM */}
        <section>
          <MintCard />
        </section>

        {/* INFO SECTION */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="GEN.001">
              Cómo Funciona la Generación
            </div>
            
            <div className="grid-row" style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem' }}>
                <h3>Combinaciones Infinitas</h3>
                <p className="mt-2">
                  Tu semilla determina cuántos videos (5-{videoCount}) y cómo se combinan. 
                  Escalas, opacidades, rotaciones, blend modes, timing — todo emerge del mismo algoritmo determinista.
                </p>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--surface-elevated)' }}>
                <div className="python-code">
                  <span className="comment"># La matemática garantiza:</span><br/>
                  <span className="keyword">for</span> seed <span className="keyword">in</span> seeds:<br/>
                  &nbsp;&nbsp;composition = generate(seed)<br/>
                  &nbsp;&nbsp;<span className="comment"># Cada seed = composición única</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section className="mt-4">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <h3>5+ Capas Dinámicas</h3>
              <p className="text-dim">
                Mínimo 5 videos, máximo todos. El algoritmo elige determinísticamente cuántos y cuáles para tu composición.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">02</div>
              <h3>Parámetros Generados</h3>
              <p className="text-dim">
                Duración, escala, opacidad, rotación, posición, blend mode. Todo controlado por tu semilla.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">03</div>
              <h3>Temas Visuales</h3>
              <p className="text-dim">
                Geometric, organic, hybrid, glitch, cinematic, abstract, kinetic. Tu seed determina el tema.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">04</div>
              <h3>Temporal Variado</h3>
              <p className="text-dim">
                Cada capa tiene su duración. El algoritmo crea composiciones de 10+ segundos con capas superpuestas.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">05</div>
              <h3>Sin Duplicados</h3>
              <p className="text-dim">
                Con {videoCount} videos y 5-{videoCount} capas: millones de combinaciones únicas posibles.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">06</div>
              <h3>Verificable</h3>
              <p className="text-dim">
                El algoritmo es público. Tu seed + nuestro código = tu composición exacta, siempre.
              </p>
            </div>
          </div>
        </section>

        {/* TECH SPECS */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="SYS.010">
              Especificaciones Técnicas
            </div>

            <div className="stats-grid" style={{ marginTop: '1rem' }}>
              <div className="stat-item">
                <div className="stat-label">Videos</div>
                <div className="stat-value">{videoCount || '25'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Mínimo Capas</div>
                <div className="stat-value">5</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Máximo Capas</div>
                <div className="stat-value">{videoCount || '25'}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Red</div>
                <div className="stat-value" style={{ fontSize: '0.9rem' }}>SEPOLIA</div>
              </div>
            </div>
          </div>
        </section>

        {/* TELEMETRY */}
        <section className="mt-3" style={{ borderTop: '1px solid var(--border-bright)', paddingTop: '1rem' }}>
          <div className="telemetry">
            <span>MODE: MINT</span>
            <span>│</span>
            <span>NETWORK: SEPOLIA</span>
            <span>│</span>
            <span>PRICE: 0.001 ETH</span>
            <span>│</span>
            <span>TIMESTAMP: </span><TimeDisplay />
          </div>
        </section>
      </div>
    </main>
  )
}
