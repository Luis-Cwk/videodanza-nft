'use client'

import { MintCard } from '@/components/mint/MintCard'
import { useIPFSLookupTable } from '@/lib/hooks/useIPFS'

export default function MintPage() {
  const { videos } = useIPFSLookupTable()
  const videoCount = videos ? Object.keys(videos).length : 0

  return (
    <main>
      {/* HERO SECTION */}
      <section style={{ marginBottom: '10vh' }}>
        <div style={{ borderTop: '1px solid #000', paddingTop: '4vh', marginBottom: '8vh' }}>
          <h1>CREAR NFT</h1>
          <p className="intro">
            Tu semilla genera una combinación única de {videoCount === 0 ? '5-25' : videoCount} videos. 
            Cada mint es una composición determinística, irreproducible y permanente en la cadena de bloques.
          </p>
        </div>
      </section>

      {/* MINT FORM */}
      <section style={{ marginBottom: '12vh' }}>
        <MintCard />
      </section>

      {/* INFO SECTION */}
      <section style={{ marginTop: '12vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h2 style={{ marginBottom: '6vh' }}>Cómo Funciona la Generación</h2>

        <div className="editorial-grid">
          <div className="editorial-info">
            <h3>Combinaciones Infinitas</h3>
            <p>
              Tu semilla determina cuántos videos (5-{videoCount}) y cómo se combinan. 
              Escalas, opacidades, rotaciones, blend modes, timing — todo emerge del mismo algoritmo determinista.
            </p>
          </div>
          <div style={{ background: '#f5f5f5', padding: '3vh 3vw', border: '1px solid #e8e8e8' }}>
            <p style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", color: '#666' }}>
              <strong>La matemática garantiza:</strong><br/>
              Cada seed produce una composición única. Nadie más puede generar la tuya. Imposible duplicar.
            </p>
          </div>
        </div>

        <div className="section-divider"></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4vw', marginTop: '8vh' }}>
          <div style={{ paddingBottom: '2vh' }}>
            <h3>5+ Capas Dinámicas</h3>
            <p>
              Mínimo 5 videos, máximo todos. El algoritmo elige determinísticamente cuántos y cuáles para tu composición.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Parámetros Generados</h3>
            <p>
              Duración, escala, opacidad, rotación, posición, blend mode. Todo controlado por tu semilla.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Temas Visuales</h3>
            <p>
              Geometric, organic, hybrid, glitch, cinematic, abstract, kinetic. Tu seed determina el tema.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Temporal Variado</h3>
            <p>
              Cada capa tiene su duración. El algoritmo crea composiciones de 10+ segundos con capas superpuestas.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Sin Duplicados</h3>
            <p>
              Con {videoCount} videos y 5-{videoCount} capas: millones de combinaciones únicas posibles.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Verificable</h3>
            <p>
              El algoritmo es público. Tu seed + nuestro código = tu composición exacta, siempre.
            </p>
          </div>
        </div>
      </section>

      {/* TECH SECTION */}
      <section style={{ marginTop: '12vh', borderTop: '1px solid #000', paddingTop: '6vh', marginBottom: '8vh' }}>
        <h2 style={{ marginBottom: '4vh' }}>Especificaciones Técnicas</h2>

        <div className="stats-grid">
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
            <div className="stat-value">Sepolia</div>
          </div>
        </div>
      </section>
    </main>
  )
}
