'use client'

import { MintCard } from '@/components/mint/MintCard'

export default function MintPage() {
  return (
    <main style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '60px', borderTop: '1px solid #000', paddingTop: '30px' }}>
        <h1 style={{ fontSize: '1.4rem', textTransform: 'uppercase', marginBottom: '20px' }}>
          Mint Your VideoDanza NFT
        </h1>
        <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.95rem', fontWeight: '300', maxWidth: '800px', textAlign: 'justify', borderLeft: '1px solid #eee', paddingLeft: '30px' }}>
          Cada seed genera una composición única y determinística. El mismo seed siempre produce el mismo video, permitiendo reproducibilidad y verificación en la cadena de bloques. Tus videos se almacenan en IPFS para acceso permanente y descentralizado.
        </p>
      </div>

      <MintCard />

      {/* Info Section */}
      <div style={{ marginTop: '80px', borderTop: '1px solid #000', paddingTop: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4vw' }}>
          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>
              Generativo
            </h3>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: '300' }}>
              Cada NFT es generado algorítmicamente usando tu seed único. La composición es reproducible y verificable.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>
              Determinístico
            </h3>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: '300' }}>
              El mismo seed siempre produce el mismo video. No hay duplicados posibles. Seguridad matemática garantizada.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>
              Descentralizado
            </h3>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '0.85rem', fontWeight: '300' }}>
              Videos almacenados en IPFS. Contratos inteligentes en Ethereum. Acceso permanente garantizado.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
