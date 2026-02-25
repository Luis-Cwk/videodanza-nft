'use client'

import Link from 'next/link'

export default function HomePage() {
  return (
    <main>
      {/* HERO SECTION */}
      <section style={{ marginBottom: '12vh' }}>
        <div style={{ borderTop: '1px solid #000', paddingTop: '6vh', marginBottom: '8vh' }}>
          <h1 style={{ marginBottom: '3vh' }}>VIDEODANZA</h1>
          <p className="intro">
            Un proyecto de arte generativo que transforma la danza en NFTs. 
            Tu semilla determina la composición. Cada mint es único, irreproducible y verificable en la cadena de bloques.
          </p>
        </div>

        <Link href="/mint" className="btn-minimal" style={{ marginTop: '2vh' }}>
          Comenzar
        </Link>
      </section>

      {/* CONCEPT SECTION */}
      <section style={{ marginTop: '12vh', borderTop: '1px solid #000', paddingTop: '6vh', marginBottom: '12vh' }}>
        <h2 style={{ marginBottom: '6vh' }}>El Concepto</h2>

        <div className="editorial-grid">
          <div className="editorial-info">
            <h3>Generatividad Pura</h3>
            <p>
              No eliges un video. El sistema genera tu composición determinísticamente usando tu semilla como input criptográfico. 
              Cada elemento —escalas, opacidades, blend modes, tiempos— emerge de un algoritmo determinista.
            </p>
          </div>
          <div style={{ background: '#f5f5f5', padding: '3vh 3vw', border: '1px solid #e8e8e8' }}>
            <p style={{ fontSize: '0.9rem', fontFamily: "'Space Grotesk', sans-serif", color: '#666', fontWeight: 300 }}>
              <strong>La semilla es el arte.</strong><br/>
              No el video. No la interfaz. La idea que contiene tu semilla es transmutada en una composición visual única mediante un algoritmo determinista.
            </p>
          </div>
        </div>

        <div className="section-divider"></div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '4vw', marginTop: '8vh' }}>
          <div>
            <h3>Determinístico</h3>
            <p>
              La misma semilla siempre genera la misma composición. 
              No hay aleatoriedad. La matemática garantiza la reproducibilidad.
            </p>
          </div>

          <div>
            <h3>Irreproducible</h3>
            <p>
              Cada semilla es única. Tu idea encriptada genera una composición que nadie más puede crear. 
              Imposible de duplicar.
            </p>
          </div>

          <div>
            <h3>Verificable</h3>
            <p>
              Tu composición puede ser verificada en la cadena. El algoritmo es público, tu seed genera exactamente lo que ves.
            </p>
          </div>

          <div>
            <h3>Permanente</h3>
            <p>
              Almacenado en IPFS y blockchain. Tu VideoDanza existirá para siempre, más allá de plataformas corporativas.
            </p>
          </div>

          <div>
            <h3>Sin Intermediarios</h3>
            <p>
              Tu composición no es "creada por Petra". Es generada por el algoritmo. Eres co-autor del resultado.
            </p>
          </div>

          <div>
            <h3>Económico</h3>
            <p>
              Solo 0.001 ETH en Sepolia. Accesible. Un gesto de participación, no de especulación.
            </p>
          </div>
        </div>
      </section>

      {/* TECHNICAL SECTION */}
      <section style={{ marginTop: '12vh', borderTop: '1px solid #000', paddingTop: '6vh', marginBottom: '12vh' }}>
        <h2 style={{ marginBottom: '4vh' }}>Cómo Funciona</h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3vw' }}>
          <div style={{ padding: '2vh 2vw', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1vh' }}>01</div>
            <h3 style={{ marginBottom: '1vh' }}>Ingresa tu Semilla</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Una palabra, frase, nombre, coordenadas. Cualquier concepto que quieras cristalizar como arte.
            </p>
          </div>

          <div style={{ padding: '2vh 2vw', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1vh' }}>02</div>
            <h3 style={{ marginBottom: '1vh' }}>El Algoritmo Genera</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Tu semilla es procesada criptográficamente. El algoritmo combina tus 5 videos en una composición única.
            </p>
          </div>

          <div style={{ padding: '2vh 2vw', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1vh' }}>03</div>
            <h3 style={{ marginBottom: '1vh' }}>Visualización</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Ves un preview de tu composición generada: capas, blend modes, escalas, rotaciones. Todo determinístico.
            </p>
          </div>

          <div style={{ padding: '2vh 2vw', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1vh' }}>04</div>
            <h3 style={{ marginBottom: '1vh' }}>Mint en Blockchain</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Conectas tu wallet y acuñas la composición. Tu seed + algoritmo = tu NFT único.
            </p>
          </div>

          <div style={{ padding: '2vh 2vw', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1vh' }}>05</div>
            <h3 style={{ marginBottom: '1vh' }}>Permanencia</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Tu composición vive en IPFS. El contrato en Ethereum. Tu idea, para siempre.
            </p>
          </div>

          <div style={{ padding: '2vh 2vw', border: '1px solid #e8e8e8' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: '900', marginBottom: '1vh' }}>06</div>
            <h3 style={{ marginBottom: '1vh' }}>Reproducibilidad</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Cualquiera puede verificar que tu composición es auténtica. El algoritmo es público.
            </p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ marginTop: '12vh', marginBottom: '8vh' }}>
        <div style={{
          border: '1px solid #000',
          padding: '6vh 4vw',
          background: '#f5f5f5',
          textAlign: 'center'
        }}>
          <h2 style={{ marginBottom: '2vh' }}>Lista para Crear</h2>
          <p style={{ marginBottom: '3vh', maxWidth: '600px', margin: '0 auto 3vh' }}>
            Tu semilla espera ser transformada en una composición visual única y permanente.
          </p>
          <Link href="/mint" className="btn-minimal">
            Ir al Mint
          </Link>
        </div>
      </section>
    </main>
  )
}
