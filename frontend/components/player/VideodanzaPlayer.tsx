'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { CompositionElement } from '@/lib/hooks/useGenerativeComposition'

interface VideodanzaPlayerProps {
  elements: CompositionElement[]
  style?: React.CSSProperties
  autoPlay?: boolean
  muted?: boolean
  hoverSound?: boolean
}

const getVideoUrl = (ipfsUri: string): string => {
  if (ipfsUri.includes('gateway.pinata.cloud/ipfs/')) {
    const cid = ipfsUri.split('/ipfs/')[1]
    return `/api/video-proxy?uri=ipfs%3A%2F%2F${cid}`
  }
  if (ipfsUri.includes('ipfs.filebase.io/ipfs/')) {
    const cid = ipfsUri.split('/ipfs/')[1]
    return `/api/video-proxy?uri=ipfs%3A%2F%2F${cid}`
  }
  return `/api/video-proxy?uri=${encodeURIComponent(ipfsUri)}`
}

// Shuffle determinista basado en seed
function seededShuffle<T>(arr: T[], seed: string): T[] {
  const shuffled = [...arr]
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash = hash & hash
  }
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    hash = ((hash << 5) - hash) + i
    hash = hash & hash
    const j = Math.abs(hash) % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export const VideodanzaPlayer = ({ 
  elements, 
  style,
  autoPlay = true,
  muted = true,
  hoverSound = false
}: VideodanzaPlayerProps) => {
  const vidARef = useRef<HTMLVideoElement>(null)
  const vidBRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(!muted)
  const [needsInteraction, setNeedsInteraction] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  
  const queueRef = useRef<string[]>([])
  const activeRef = useRef<'a' | 'b'>('a')
  const isTransitioningRef = useRef(false)
  const cycleRef = useRef(0)

  // Sound should play when: (hover sound enabled + hovered) OR (not hover sound + not muted)
  const shouldPlaySound = hoverSound ? isHovered : !muted

  // Generar queue determinista basado en ciclo
  const buildQueue = useCallback(() => {
    const urls = elements.map(el => getVideoUrl(el.ipfsUri))
    
    // Primera reproducción: orden original (determinista)
    if (cycleRef.current === 0) {
      return [...urls]
    }
    
    // Reproducciones siguientes: shuffle determinista basado en ciclo + seed del primer elemento
    const seed = `${cycleRef.current}-${elements[0]?.ipfsUri || 'default'}`
    return seededShuffle(urls, seed)
  }, [elements])

  const getActiveVideo = () => activeRef.current === 'a' ? vidARef.current : vidBRef.current
  const getInactiveVideo = () => activeRef.current === 'a' ? vidBRef.current : vidARef.current

  const preloadNext = useCallback(() => {
    const inactive = getInactiveVideo()
    if (!inactive) return

    // Si la queue está vacía, reconstruir
    if (queueRef.current.length === 0) {
      cycleRef.current++
      queueRef.current = buildQueue()
    }
    
    const nextUrl = queueRef.current.shift()!
    inactive.src = nextUrl
    inactive.load()
  }, [buildQueue])

  const handleClipEnd = useCallback(() => {
    if (isTransitioningRef.current) return
    isTransitioningRef.current = true

    const active = getActiveVideo()
    const inactive = getInactiveVideo()
    
    if (!active || !inactive) {
      isTransitioningRef.current = false
      return
    }

    // Arrancar el siguiente
    inactive.play().catch(() => {})
    
    // Crossfade
    inactive.style.opacity = '1'
    active.style.opacity = '0'

    // Esperar crossfade y limpiar
    setTimeout(() => {
      active.pause()
      active.currentTime = 0
      
      // Intercambiar roles
      activeRef.current = activeRef.current === 'a' ? 'b' : 'a'
      
      // Precargar siguiente
      preloadNext()
      
      isTransitioningRef.current = false
    }, 600)
  }, [preloadNext])

  const startPlayback = useCallback(() => {
    if (elements.length === 0) return
    
    // Reiniciar ciclo
    cycleRef.current = 0
    queueRef.current = buildQueue()
    
    const active = getActiveVideo()
    if (!active) return

    const firstUrl = queueRef.current.shift()!
    active.src = firstUrl
    active.muted = !audioUnlocked
    
    active.play().then(() => {
      setIsPlaying(true)
      setNeedsInteraction(false)
      preloadNext()
    }).catch(() => {
      setNeedsInteraction(true)
    })
  }, [elements, audioUnlocked, buildQueue, preloadNext])

  const handleUserInteraction = useCallback(() => {
    setAudioUnlocked(true)
    
    const active = getActiveVideo()
    if (active) {
      active.muted = false
    }
    
    if (!isPlaying) {
      startPlayback()
    }
  }, [isPlaying, startPlayback])

  useEffect(() => {
    const active = vidARef.current
    if (!active || elements.length === 0) return

    if (autoPlay) {
      startPlayback()
    } else {
      setNeedsInteraction(true)
    }

    return () => {
      if (vidARef.current) {
        vidARef.current.pause()
        vidARef.current.src = ''
      }
      if (vidBRef.current) {
        vidBRef.current.pause()
        vidBRef.current.src = ''
      }
    }
  }, [elements, autoPlay, startPlayback])

  const handleMouseEnter = () => {
    if (hoverSound) {
      setIsHovered(true)
      setAudioUnlocked(true)
      const active = getActiveVideo()
      if (active && active.paused) {
        active.play().catch(() => {})
      }
    }
  }

  const handleMouseLeave = () => {
    if (hoverSound) {
      setIsHovered(false)
      const active = getActiveVideo()
      if (active && !active.paused) {
        active.pause()
      }
    }
  }

  return (
    <div 
      style={{ position: 'relative', width: '100%', aspectRatio: '16/9', ...style }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <video
        ref={vidARef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: 1,
          transition: 'opacity 600ms ease',
          zIndex: 1,
        }}
        playsInline
        muted={!shouldPlaySound}
        onEnded={handleClipEnd}
      />
      <video
        ref={vidBRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          opacity: 0,
          transition: 'opacity 600ms ease',
          zIndex: 2,
        }}
        playsInline
        muted={!shouldPlaySound}
        onEnded={handleClipEnd}
      />
      
      {needsInteraction && !hoverSound && (
        <button
          onClick={handleUserInteraction}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            cursor: 'pointer',
            zIndex: 10,
            color: '#fff',
            fontSize: '3rem',
          }}
        >
          ▶
        </button>
      )}
    </div>
  )
}
