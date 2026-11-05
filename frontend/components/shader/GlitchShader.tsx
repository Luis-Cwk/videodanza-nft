'use client'

import { useEffect, useRef, useCallback } from 'react'

interface GlitchShaderProps {
  videoRef: HTMLVideoElement | null
  intensity: number
  mode: 'low' | 'medium' | 'high'
  style?: React.CSSProperties
}

const GLITCH_SHADER = {
  low: {
    rgbShift: 0.002,
    pixelDisplace: 0,
    blockGlitch: false,
    colorDrain: false,
  },
  medium: {
    rgbShift: 0.008,
    pixelDisplace: 2,
    blockGlitch: false,
    colorDrain: false,
  },
  high: {
    rgbShift: 0.02,
    pixelDisplace: 8,
    blockGlitch: true,
    colorDrain: true,
  },
}

export function GlitchShader({ videoRef, intensity, mode, style }: GlitchShaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const params = GLITCH_SHADER[mode]

  const applyGlitch = useCallback(() => {
    if (!videoRef || !canvasRef.current || videoRef.paused || videoRef.readyState < 2) {
      animationRef.current = requestAnimationFrame(applyGlitch)
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    const video = videoRef
    
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
    }

    ctx.drawImage(video, 0, 0)

    if (intensity > 0.1) {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      const rgbShiftAmount = params.rgbShift * intensity * canvas.width
      const pixelDisplace = Math.floor(params.pixelDisplace * intensity)

      for (let y = 0; y < canvas.height; y += 4) {
        for (let x = 0; x < canvas.width; x += 4) {
          if (Math.random() < intensity * 0.1) {
            const i = (y * canvas.width + x) * 4

            if (rgbShiftAmount > 0) {
              const shiftX = Math.floor(Math.random() * rgbShiftAmount * 2 - rgbShiftAmount)
              const shiftY = Math.floor(Math.random() * rgbShiftAmount * 2 - rgbShiftAmount)
              const newX = Math.min(canvas.width - 1, Math.max(0, x + shiftX))
              const newY = Math.min(canvas.height - 1, Math.max(0, y + shiftY))
              const ni = (newY * canvas.width + newX) * 4

              data[i] = data[ni]
              data[i + 1] = data[ni + 1]
              data[i + 2] = data[ni + 2]
            }

            if (pixelDisplace > 0 && Math.random() < intensity * 0.3) {
              const displaceX = Math.floor(Math.random() * pixelDisplace * 2 - pixelDisplace)
              const displaceY = Math.floor(Math.random() * pixelDisplace * 2 - pixelDisplace)
              const ni = ((y + displaceY) * canvas.width + (x + displaceX)) * 4
              
              if (ni >= 0 && ni < data.length - 3) {
                const tempR = data[i]
                const tempG = data[i + 1]
                const tempB = data[i + 2]
                
                data[i] = data[ni]
                data[i + 1] = data[ni + 1]
                data[i + 2] = data[ni + 2]
                
                if (ni + 2 < data.length) {
                  data[ni] = tempR
                  data[ni + 1] = tempG
                  data[ni + 2] = tempB
                }
              }
            }

            if (params.blockGlitch && Math.random() < intensity * 0.2) {
              const blockHeight = Math.floor(Math.random() * 20 * intensity) + 2
              const blockY = Math.floor(Math.random() * (canvas.height - blockHeight))
              
              for (let by = blockY; by < blockY + blockHeight && by < canvas.height; by++) {
                for (let bx = 0; bx < canvas.width; bx += 8) {
                  const bi = (by * canvas.width + bx) * 4
                  data[bi] = 255 - data[bi]
                  data[bi + 1] = 255 - data[bi + 1]
                  data[bi + 2] = 255 - data[bi + 2]
                }
              }
            }

            if (params.colorDrain && Math.random() < intensity * 0.15) {
              const channel = Math.floor(Math.random() * 3)
              const drainAmount = Math.floor(Math.random() * 50 * intensity)
              data[i + channel] = Math.max(0, data[i + channel] - drainAmount)
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0)
    }

    animationRef.current = requestAnimationFrame(applyGlitch)
  }, [videoRef, intensity, params])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(applyGlitch)
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [applyGlitch])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        pointerEvents: 'none',
        zIndex: 3,
        ...style,
      }}
    />
  )
}

export function getGlitchCSS(mode: 'low' | 'medium' | 'high', intensity: number): React.CSSProperties {
  const filters: string[] = []
  
  if (intensity > 0) {
    if (mode === 'high') {
      filters.push(`saturate(${1 + intensity * 0.5})`)
      filters.push(`contrast(${1 + intensity * 0.3})`)
      filters.push(`hue-rotate(${intensity * 10}deg)`)
    } else if (mode === 'medium') {
      filters.push(`saturate(${1 + intensity * 0.2})`)
      filters.push(`contrast(${1 + intensity * 0.1})`)
    }
  }

  return {
    filter: filters.length > 0 ? filters.join(' ') : undefined,
    transition: 'filter 0.3s ease',
  }
}