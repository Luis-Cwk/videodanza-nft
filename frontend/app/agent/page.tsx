'use client'

import { useState, useCallback } from 'react'
import { AgentChat } from '@/components/agent/AgentChat'
import { CompositionPanel } from '@/components/agent/CompositionPanel'
import { OnchainActivityPanel } from '@/components/agent/OnchainActivityPanel'

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
        <section className="hero-section">
          <h1>ESTUDIO CREATIVO</h1>
          <p className="intro">
            Co-crea con entropiav2. Describe la emocion que quieres explorar y el agente
            generara tu composicion de videodanza unica. Cuando te guste, acunala como NFT.
          </p>
        </section>

        <section className="mt-3">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            <a className="btn-fui" href="https://my-agent-tau.vercel.app/.well-known/agent-card.json" target="_blank" rel="noopener noreferrer">Agent Card</a>
            <a className="btn-fui" href="https://my-agent-tau.vercel.app/a2a" target="_blank" rel="noopener noreferrer">A2A Endpoint</a>
            <a className="btn-fui" href="https://my-agent-tau.vercel.app/mcp" target="_blank" rel="noopener noreferrer">MCP Endpoint</a>
            <a className="btn-fui" href="https://www.8004scan.io/agents/sepolia/2387" target="_blank" rel="noopener noreferrer">8004scan / ID 2387</a>
            <a className="btn-fui" href="https://sepolia.etherscan.io/address/0x6bcE199069A02917114DD8a9BDca5E6886f2Afaa" target="_blank" rel="noopener noreferrer">Owner en Etherscan</a>
          </div>
        </section>

        <section className="mt-4">
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1px',
            background: 'var(--border)',
            border: '1px solid var(--border-bright)',
            minHeight: '70vh',
          }}>
            <div style={{ background: 'var(--bg)', minHeight: '70vh' }}>
              <AgentChat
                onSeedSelect={handleSeedFromAgent}
                currentSeed={currentSeed}
              />
            </div>

            <div style={{ background: 'var(--bg)', minHeight: '70vh' }}>
              <CompositionPanel
                suggestedSeed={suggestedSeed}
                onSeedChange={setCurrentSeed}
              />
            </div>
          </div>
        </section>

        <OnchainActivityPanel />

        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="FEEDBACK.001">
              Dejar Feedback On-Chain
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gap: '0.65rem' }}>
              <p className="text-dim" style={{ margin: 0, fontSize: '0.84rem' }}>
                Si eres dev o tester, ayúdanos a subir reputación real del agente dejando feedback on-chain en Sepolia.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                <a className="btn-fui" href="https://www.8004scan.io/agents/sepolia/2387" target="_blank" rel="noopener noreferrer">Ver agente 2387</a>
                <a className="btn-fui" href="https://my-agent-tau.vercel.app/.well-known/agent-card.json" target="_blank" rel="noopener noreferrer">Ver Agent Card</a>
              </div>
              <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: '0.75rem' }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  Pasos rapidos:
                </div>
                <ol style={{ margin: '0.45rem 0 0 1rem', padding: 0, fontSize: '0.8rem', color: 'var(--text)' }}>
                  <li>Prueba el estudio (/agent) o el MCP del agente.</li>
                  <li>Ejecuta el script de feedback con tu wallet de Sepolia.</li>
                  <li>Comparte tx hash + comentario para trazabilidad.</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

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
