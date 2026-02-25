'use client'

import { MintCard } from '@/components/mint/MintCard'

export default function MintPage() {
  return (
    <main>
      {/* HERO SECTION */}
      <section style={{ marginBottom: '10vh' }}>
        <div style={{ borderTop: '1px solid #000', paddingTop: '4vh', marginBottom: '8vh' }}>
          <h1>CREAR NFT</h1>
          <p className="intro">
            Tus movimientos, tus gestos, tu energía — preservados en la cadena de bloques. 
            Cada seed crea una composición única, determinística y permanente.
          </p>
        </div>
      </section>

      {/* MINT FORM */}
      <section style={{ marginBottom: '12vh' }}>
        <MintCard />
      </section>

      {/* INFO SECTION */}
      <section style={{ marginTop: '12vh', borderTop: '1px solid #000', paddingTop: '6vh' }}>
        <h2 style={{ marginBottom: '6vh' }}>Cómo funciona</h2>
        
        <div className="editorial-grid">
          <div className="editorial-info">
            <h3>Semilla determinística</h3>
            <p>
              Tu seed no es aleatorio. Es una frase que tú eliges, hasheada criptográficamente. 
              El mismo seed siempre genera el mismo video, creando certeza y reproducibilidad.
            </p>
          </div>
          <div style={{ background: '#f5f5f5', padding: '3vh 3vw', border: '1px solid #e8e8e8' }}>
            <p style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", color: '#666' }}>
              <strong>Ejemplo:</strong><br/>
              Seed: "mi nombre en movimiento"<br/>
              ↓<br/>
              Hash: 0x7f3a8b2c...<br/>
              ↓<br/>
              Video único generado
            </p>
          </div>
        </div>

        <div className="section-divider"></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4vw', marginTop: '8vh' }}>
          <div style={{ paddingBottom: '2vh' }}>
            <h3>Verificable</h3>
            <p>
              La matemática garantiza que tu video es único e irrepetible. 
              Cualquiera puede verificar su autenticidad en la cadena de bloques.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Permanente</h3>
            <p>
              Almacenados en IPFS, tus NFT existirán para siempre. 
              Descentralizados, resistentes, más allá de corporaciones.
            </p>
          </div>

          <div style={{ paddingBottom: '2vh' }}>
            <h3>Interoperable</h3>
            <p>
              Compatible con cualquier wallet y marketplace de Ethereum. 
              Tu NFT es tuyo, verdaderamente tuyo.
            </p>
          </div>
        </div>
      </section>

      {/* SPEC SECTION */}
      <section style={{ marginTop: '12vh', borderTop: '1px solid #000', paddingTop: '6vh', marginBottom: '8vh' }}>
        <h2 style={{ marginBottom: '4vh' }}>Especificaciones técnicas</h2>
        
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">Red</div>
            <div className="stat-value">Ethereum Sepolia</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Precio</div>
            <div className="stat-value">0.001 ETH</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Estándar</div>
            <div className="stat-value">ERC-721</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Almacenamiento</div>
            <div className="stat-value">IPFS + Blockchain</div>
          </div>
        </div>
      </section>
    </main>
  )
}
