'use client'

import { useState } from 'react'
import { useGenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { VideodanzaPlayer } from '@/components/player/VideodanzaPlayer'
import { getGlitchCSS } from '@/components/shader/GlitchShader'

const TEST_SEED = 'test-glitch-debug-2026' as `0x${string}`

export default function GlitchDebugPage() {
  const composition = useGenerativeComposition(TEST_SEED)
  const [glitchMode, setGlitchMode] = useState<'low' | 'medium' | 'high'>('medium')
  const [glitchIntensity, setGlitchIntensity] = useState(0.5)
  const [showCanvas, setShowCanvas] = useState(true)

  if (!composition) {
    return (
      <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
        <h1>Debug Glitch Shader</h1>
        <p>Generando composición de prueba...</p>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: "'JetBrains Mono', monospace",
      background: '#0a0a0a',
      minHeight: '100vh',
      color: '#fff'
    }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        Debug: Glitch Shader Test
      </h1>

      <div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <label>
          Modo:
          <select 
            value={glitchMode} 
            onChange={(e) => setGlitchMode(e.target.value as any)}
            style={{ marginLeft: '0.5rem', padding: '0.25rem' }}
          >
            <option value="low">Low (subtil)</option>
            <option value="medium">Medium</option>
            <option value="high">High (intenso)</option>
          </select>
        </label>

        <label style={{ marginLeft: '1rem' }}>
          Intensidad:
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={glitchIntensity}
            onChange={(e) => setGlitchIntensity(parseFloat(e.target.value))}
            style={{ marginLeft: '0.5rem', width: '150px' }}
          />
          <span style={{ marginLeft: '0.5rem' }}>{(glitchIntensity * 100).toFixed(0)}%</span>
        </label>

        <label style={{ marginLeft: '1rem' }}>
          <input 
            type="checkbox" 
            checked={showCanvas}
            onChange={(e) => setShowCanvas(e.target.checked)}
          />
          Canvas Overlay
        </label>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.5rem' }}>
            CON GLITCH (con props)
          </h2>
          <div style={{ 
            border: `2px solid ${glitchMode === 'high' ? '#ff4444' : glitchMode === 'medium' ? '#ffaa00' : '#44ff44'}`,
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <VideodanzaPlayer
              elements={composition.elements}
              autoPlay={true}
              muted={false}
              glitchMode={glitchMode}
              glitchIntensity={glitchIntensity}
              hoverSound={false}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
            glitchMode: {glitchMode} | glitchIntensity: {glitchIntensity.toFixed(2)}
          </p>
        </div>

        <div>
          <h2 style={{ fontSize: '1rem', color: '#888', marginBottom: '0.5rem' }}>
            SIN GLITCH (default props)
          </h2>
          <div style={{ 
            border: '2px solid #333',
            borderRadius: '8px',
            overflow: 'hidden'
          }}>
            <VideodanzaPlayer
              elements={composition.elements}
              autoPlay={true}
              muted={false}
              hoverSound={false}
            />
          </div>
          <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
            Sin props de glitch - usa defaults (intensity=0, mode=low)
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', background: '#1a1a1a', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>CSS Filters aplicados:</h3>
        <code style={{ fontSize: '0.75rem', color: '#0066ff' }}>
          {JSON.stringify(getGlitchCSS(glitchMode, glitchIntensity), null, 2)}
        </code>
      </div>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Estructura de glitch:</h3>
        <ul style={{ fontSize: '0.8rem', color: '#888', lineHeight: '1.8' }}>
          <li><strong>CSS Filters</strong>: saturate(), contrast(), hue-rotate() - siempre aplicados cuando intensity {'>'} 0</li>
          <li><strong>Canvas Overlay</strong>: RGB shift, pixel displacement, block glitch - requiere videoRef activo</li>
          <li><strong>Low</strong>: rgbShift=0.002, sin block glitch</li>
          <li><strong>Medium</strong>: rgbShift=0.008, pixelDisplace=2px, sin color drain</li>
          <li><strong>High</strong>: rgbShift=0.02, pixelDisplace=8px, block glitch + color drain</li>
        </ul>
      </div>

      <div style={{ marginTop: '2rem', fontSize: '0.75rem', color: '#666' }}>
        <p>Composicion: {composition.elements.length} capas | Tema: {composition.theme}</p>
        <p>Seed: {TEST_SEED}</p>
      </div>
    </div>
  )
}