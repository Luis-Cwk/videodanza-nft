'use client'

import { useState, useCallback } from 'react'
import { AgentChat } from '@/components/agent/AgentChat'
import { CompositionPanel } from '@/components/agent/CompositionPanel'

const TimeDisplay = () => {
  const [time] = useState<string>(Date.now().toString())
  return <>{time}</>
}

export default function AgentPage() {
  const [suggestedSeed, setSuggestedSeed] = useState<string | null>(null)
  const [currentSeed, setCurrentSeed] = useState<string | null>(null)

  const handleSeedFromAgent = useCallback((seed: string) => {
    setSuggestedSeed(seed)
  }, [])

  return (
    <main>
      <div className="page-content">
        {/* HERO */}
        <section className="hero-section">
          <h1>ESTUDIO CREATIVO</h1>
          <p className="intro">
            Co-crea con entropiav2. Describe la emocion que quieres explorar y el agente
            generara tu composicion de videodanza unica. Cuando te guste, acunala como NFT.
          </p>
        </section>

        {/* STUDIO: Chat + Preview */}
        <section className="mt-4">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border-bright)',
            minHeight: '70vh',
          }}>
            {/* Left: Agent Chat */}
            <div style={{ background: 'var(--bg)', minHeight: '70vh' }}>
              <AgentChat
                onSeedSelect={handleSeedFromAgent}
                currentSeed={currentSeed}
              />
            </div>

            {/* Right: Composition Panel */}
            <div style={{ background: 'var(--bg)', minHeight: '70vh' }}>
              <CompositionPanel
                suggestedSeed={suggestedSeed}
                onSeedChange={setCurrentSeed}
              />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="STUDIO.001">
              Como Funciona el Estudio
            </div>

            <div className="feature-grid" style={{ marginTop: '1.5rem' }}>
              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>01</div>
                <h3>Conversa</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Describe la emocion, el movimiento o la sensacion que quieres explorar. El agente entiende de danza.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>02</div>
                <h3>Descubre</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  El agente sugiere semillas que generan composiciones unicas. Cada semilla produce una pieza diferente.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>03</div>
                <h3>Explora</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Ve la composicion en tiempo real. Pide ajustes, cambia la semilla, prueba hasta encontrar la perfecta.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>04</div>
                <h3>Acuna</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Cuando encuentres tu pieza, acunala como NFT en Sepolia. Tu videodanza vivira para siempre en la cadena.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* TELEMETRY */}
        <section className="mt-3" style={{ borderTop: '1px solid var(--border-bright)', paddingTop: '1rem' }}>
          <div className="telemetry">
            <span>MODE: STUDIO</span>
            <span>│</span>
            <span>AGENT: entropiav2</span>
            <span>│</span>
            <span>STATUS: ACTIVE</span>
            <span>│</span>
            <span>TIMESTAMP: </span><TimeDisplay />
          </div>
        </section>
      </div>
    </main>
  )
}
