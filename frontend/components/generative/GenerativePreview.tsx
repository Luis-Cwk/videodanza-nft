'use client'

import { useState } from 'react'
import { GenerativeComposition } from '@/lib/hooks/useGenerativeComposition'
import { VideodanzaPlayer } from '@/components/player/VideodanzaPlayer'

interface GenerativePreviewProps {
  composition: GenerativeComposition | null
  isLoading?: boolean
}

const BLEND_MODE_COLORS: Record<string, string> = {
  'normal': 'rgba(255, 255, 255, 0.8)',
  'multiply': 'rgba(0, 0, 0, 0.7)',
  'screen': 'rgba(255, 255, 255, 0.5)',
  'overlay': 'rgba(128, 128, 128, 0.5)',
  'darken': 'rgba(0, 0, 0, 0.8)',
  'lighten': 'rgba(255, 255, 255, 0.6)',
  'soft-light': 'rgba(200, 200, 200, 0.4)',
  'hard-light': 'rgba(100, 100, 100, 0.5)',
  'difference': 'rgba(128, 128, 128, 0.6)',
  'color-dodge': 'rgba(255, 255, 200, 0.4)',
  'color-burn': 'rgba(100, 50, 0, 0.5)',
}

const getBlendSwatch = (blendMode: string): string => {
  return BLEND_MODE_COLORS[blendMode.toLowerCase()] || 'rgba(255, 255, 255, 0.5)'
}

export const GenerativePreview = ({ composition, isLoading = false }: GenerativePreviewProps) => {
  const [showFullHash, setShowFullHash] = useState(false)

  if (!composition || isLoading) {
    return (
      <div style={{
        width: '100%',
        aspectRatio: '16/9',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0a',
        border: '1px solid #1a1a1a',
        color: '#666',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '0.9rem',
      }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ marginBottom: '1rem', color: '#00d4ff', opacity: 0.5, fontSize: '2rem' }}>◈</div>
          {isLoading ? 'Generando composición...' : 'Ingresa una semilla para ver preview'}
        </div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0a0a0a',
      border: '1px solid #1a1a1a',
      overflow: 'hidden',
    }}>
      {/* 1. PREVIEW VIDEO - HERO */}
      <div style={{ 
        position: 'relative', 
        width: '100%',
        aspectRatio: '16/9',
        background: '#000',
      }}>
        <VideodanzaPlayer 
          elements={composition.elements} 
          autoPlay={true}
          muted={false}
          hoverSound={true}
        />
        
        {/* Theme overlay flotando sobre el video */}
        <div
          style={{
            position: 'absolute',
            top: '1rem',
            left: '1rem',
            zIndex: 100,
            background: 'rgba(0, 0, 0, 0.7)',
            padding: '0.5rem 1rem',
            borderLeft: '3px solid #00d4ff',
          }}
        >
          <div style={{ 
            fontSize: '1.2rem', 
            fontWeight: 700, 
            textTransform: 'uppercase', 
            letterSpacing: '2px',
            color: '#00d4ff',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            {composition.theme}
          </div>
        </div>

        {/* Info overlay en bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
            padding: '1.5rem 1rem 1rem',
            zIndex: 100,
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '0.75rem', 
            fontFamily: "'JetBrains Mono', monospace", 
            color: '#888',
          }}>
            <span>{composition.elements.length} capas</span>
            <span>{composition.totalDuration.toFixed(1)}s duración</span>
          </div>
        </div>
      </div>

      {/* Contenido debajo del video */}
      <div style={{ padding: '1.5rem' }}>
        
        {/* 2. SEMILLA - PROMINENTE */}
        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#00d4ff',
            marginBottom: '0.5rem',
            fontFamily: "'JetBrains Mono', monospace",
          }}>
            Semilla / Seed
          </label>
          
          <div style={{
            background: '#111',
            border: '1px solid #00d4ff',
            padding: '1rem',
            borderRadius: '4px',
          }}>
            <div style={{ 
              fontSize: '1.5rem', 
              fontWeight: 700, 
              color: '#fff',
              fontFamily: "'JetBrains Mono', monospace",
              marginBottom: '0.5rem',
              textTransform: 'lowercase',
            }}>
              {composition.seed}
            </div>
            
            {/* Acordeón para hash completo */}
            <button
              onClick={() => setShowFullHash(!showFullHash)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#00d4ff',
                fontSize: '0.75rem',
                cursor: 'pointer',
                padding: 0,
                fontFamily: "'JetBrains Mono', monospace",
                textDecoration: 'underline',
              }}
            >
              {showFullHash ? '▼ Ocultar' : '▲ Ver identificador completo'}
            </button>
            
            {showFullHash && (
              <div style={{
                marginTop: '0.75rem',
                padding: '0.75rem',
                background: '#0a0a0a',
                border: '1px solid #222',
                fontSize: '0.65rem',
                fontFamily: "'JetBrains Mono', monospace",
                color: '#666',
                wordBreak: 'break-all',
              }}>
                {composition.hash}
              </div>
            )}
          </div>
        </div>

        {/* 3. CAPAS CON SWATCHS VISUALES */}
        {composition.elements.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.7rem',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#00d4ff',
              marginBottom: '1rem',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              Capas de Composición
            </label>

            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '1px',
              background: '#1a1a1a',
              border: '1px solid #1a1a1a',
            }}>
              {composition.elements.slice(0, 6).map((element, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0.75rem 1rem',
                    background: '#111',
                  }}
                >
                  {/* Swatch visual del blend mode */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      background: getBlendSwatch(element.blendMode),
                      borderRadius: '4px',
                      marginRight: '1rem',
                      border: '1px solid #333',
                    }}
                  />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      fontWeight: 600, 
                      color: '#fff',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      Capa {idx + 1}
                    </div>
                    <div style={{ 
                      fontSize: '0.65rem', 
                      color: '#666',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {element.videoName}
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: '0.7rem', 
                      color: '#00d4ff',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {element.blendMode}
                    </div>
                    <div style={{ 
                      fontSize: '0.6rem', 
                      color: '#666',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>
                      {Math.round(element.opacity * 100)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. PRECIO + ESTADO + BOTÓN - juntos cerca del CTA */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          padding: '1rem',
          background: '#111',
          border: '1px solid #222',
          borderRadius: '4px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#666', 
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Precio
              </div>
              <div style={{ 
                fontSize: '1rem', 
                fontWeight: 700, 
                color: '#00d4ff',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                0.001 ETH
              </div>
            </div>
            
            <div style={{
              width: '1px',
              height: '30px',
              background: '#333',
            }} />
            
            <div>
              <div style={{ 
                fontSize: '0.65rem', 
                color: '#666', 
                textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                Estado
              </div>
              <div style={{ 
                fontSize: '0.8rem', 
                fontWeight: 700, 
                color: '#00ff88',
                fontFamily: "'JetBrains Mono', monospace",
                textTransform: 'uppercase',
              }}>
                LISTO
              </div>
            </div>
          </div>

          {/* Botón de acción - pasar como children si se necesita */}
          <div id="mint-cta-button" />
        </div>
      </div>
    </div>
  )
}