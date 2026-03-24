'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const TimeDisplay = () => {
  const [time, setTime] = useState<string>('')
  useEffect(() => { setTime(Date.now().toString()) }, [])
  return <>{time}</>
}

export default function HomePage() {
  return (
    <main>
      <div className="page-content">
        {/* HERO SECTION */}
        <section className="hero-section">
          <h1>VIDEODANZA</h1>
          <p className="intro">
            Un proyecto de arte generativo que transforma la danza en NFTs. 
            Tu semilla determina la composición. Cada mint es único, irreproducible y verificable en la cadena de bloques.
          </p>
          <div className="mt-3">
            <Link href="/mint" className="btn-fui btn-fui-primary">
              → Iniciar Generación
            </Link>
          </div>
        </section>

        {/* CONCEPT SECTION */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="SYS.001">
              El Concepto
            </div>
            
            <div className="grid-row" style={{ marginBottom: '2rem' }}>
              <div style={{ padding: '1.5rem' }}>
                <h3>Generatividad Pura</h3>
                <p className="mt-2">
                  No eliges un video. El sistema genera tu composición determinísticamente usando tu semilla como input criptográfico. 
                  Cada elemento —escalas, opacidades, blend modes, tiempos— emerge de un algoritmo determinista.
                </p>
              </div>
              <div style={{ padding: '1.5rem', background: 'var(--surface-elevated)' }}>
                <div className="python-code">
                  <span className="comment"># La semilla es el arte</span><br/>
                  <span className="keyword">def</span> <span className="function">generate_composition</span>(<span className="keyword">seed</span>):<br/>
                  &nbsp;&nbsp;<span className="keyword">return</span> deterministic_hash(seed)<br/>
                  &nbsp;&nbsp;<span className="comment"># Imposible de duplicar</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="mt-4">
          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-number">01</div>
              <h3>Determinístico</h3>
              <p>
                La misma semilla siempre genera la misma composición. 
                No hay aleatoriedad. La matemática garantiza la reproducibilidad.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">02</div>
              <h3>Irreproducible</h3>
              <p>
                Cada semilla es única. Tu idea encriptada genera una composición que nadie más puede crear.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">03</div>
              <h3>Verificable</h3>
              <p>
                Tu composición puede ser verificada en la cadena. El algoritmo es público, tu seed genera exactamente lo que ves.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">04</div>
              <h3>Permanente</h3>
              <p>
                Almacenado en IPFS y blockchain. Tu VideoDanza existirá para siempre, más allá de plataformas corporativas.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">05</div>
              <h3>Sin Intermediarios</h3>
              <p>
                Tu composición no es "creada por Petra". Es generada por el algoritmo. Eres co-autor del resultado.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-number">06</div>
              <h3>Económico</h3>
              <p>
                Solo 0.001 ETH en Sepolia. Accesible. Un gesto de participación, no de especulación.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="mt-4">
          <div className="data-panel">
            <div className="data-panel-label" data-coord="SYS.002">
              Cómo Funciona
            </div>

            <div className="feature-grid" style={{ marginTop: '1.5rem' }}>
              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>01</div>
                <h3>Ingresa tu Semilla</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Una palabra, frase, nombre, coordenadas. Cualquier concepto que quieras cristalizar como arte.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>02</div>
                <h3>El Algoritmo Genera</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Tu semilla es procesada criptográficamente. El algoritmo combina tus videos en una composición única.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>03</div>
                <h3>Visualización</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Ves un preview de tu composición generada: capas, blend modes, escalas, rotaciones. Todo determinístico.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>04</div>
                <h3>Mint en Blockchain</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Conectas tu wallet y acuñas la composición. Tu seed + algoritmo = tu NFT único.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>05</div>
                <h3>Permanencia</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Tu composición vive en IPFS. El contrato en Ethereum. Tu idea, para siempre.
                </p>
              </div>

              <div className="feature-card">
                <div className="feature-number" style={{ fontSize: '1.2rem' }}>06</div>
                <h3>Reproducibilidad</h3>
                <p className="text-dim" style={{ fontSize: '0.85rem' }}>
                  Cualquiera puede verificar que tu composición es auténtica. El algoritmo es público.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION */}
        <section className="mt-4">
          <div className="cta-section">
            <h2 style={{ marginBottom: '1rem' }}>Lista para Crear</h2>
            <p className="text-dim mb-3">
              Tu semilla espera ser transformada en una composición visual única y permanente.
            </p>
            <Link href="/mint" className="btn-fui btn-fui-primary">
              → Ir al Mint
            </Link>
          </div>
        </section>

        {/* TELEMETRY FOOTER */}
        <section className="mt-4" style={{ borderTop: '1px solid var(--border-bright)', paddingTop: '1rem' }}>
          <div className="telemetry">
            <span>SYSTEM: ONLINE</span>
            <span>│</span>
            <span>NETWORK: SEPOLIA</span>
            <span>│</span>
            <span>CONTRACT: 0x4986...763</span>
            <span>│</span>
            <span>TIMESTAMP: </span><TimeDisplay />
          </div>
        </section>
      </div>
    </main>
  )
}
