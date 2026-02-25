import { useMemo } from 'react'
import { useIPFSLookupTable } from './useIPFS'

export interface CompositionElement {
  videoKey: string
  videoName: string
  ipfsUri: string
  startTime: number
  duration: number
  scale: number
  opacity: number
  rotation: number
  positionX: number
  positionY: number
  blendMode: string
  effectId: number
}

export interface GenerativeComposition {
  seed: string
  elements: CompositionElement[]
  totalDuration: number
  backgroundIntensity: number
  theme: 'geometric' | 'organic' | 'hybrid' | 'glitch' | 'cinematic'
  colorShift: number
  audioIntensity: number
  hash: string
}

/**
 * Deterministic pseudo-random number generator (seeded)
 * Based on seed, always produces the same sequence of values
 */
class SeededRandom {
  private seed: number

  constructor(seed: string) {
    // Convert hex seed to a number for consistent hashing
    this.seed = parseInt(seed.slice(2, 10), 16) || 0
  }

  private next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280
    return this.seed / 233280
  }

  range(min: number, max: number): number {
    return min + this.next() * (max - min)
  }

  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)]
  }

  boolean(probability = 0.5): boolean {
    return this.next() < probability
  }
}

export const useGenerativeComposition = (
  seedHash: `0x${string}` | null
): GenerativeComposition | null => {
  const { videos } = useIPFSLookupTable()

  return useMemo(() => {
    if (!seedHash || !videos || Object.keys(videos).length === 0) {
      return null
    }

    const rng = new SeededRandom(seedHash)
    const videoKeys = Object.keys(videos)

    // Theme selection (deterministic)
    const themes: Array<'geometric' | 'organic' | 'hybrid' | 'glitch' | 'cinematic'> = [
      'geometric',
      'organic',
      'hybrid',
      'glitch',
      'cinematic',
    ]
    const theme = rng.choice(themes)

    // Number of elements (2-4 videos layered)
    const elementCount = Math.floor(rng.range(2, 4.99))

    // Generate composition elements
    const elements: CompositionElement[] = []
    let currentTime = 0
    const baseElementDuration = rng.range(4, 8)

    for (let i = 0; i < elementCount; i++) {
      const videoKey = rng.choice(videoKeys)
      const videoData = videos[videoKey]

      if (!videoData) continue

      // Deterministic parameters based on seed
      const duration = baseElementDuration + rng.range(-1, 2)
      const scale = rng.range(0.6, 1.4)
      const opacity = rng.range(0.4, 1.0)
      const rotation = rng.range(0, 360)
      const positionX = rng.range(-20, 120)
      const positionY = rng.range(-20, 120)

      const blendModes = ['normal', 'multiply', 'screen', 'overlay', 'color-dodge', 'darken', 'lighten']
      const blendMode = rng.choice(blendModes)

      const effectId = Math.floor(rng.range(0, 5))

      elements.push({
        videoKey,
        videoName: videoKey.replace(/\.mp4/, '').slice(0, 30),
        ipfsUri: videoData.ipfs,
        startTime: currentTime,
        duration,
        scale,
        opacity,
        rotation,
        positionX,
        positionY,
        blendMode,
        effectId,
      })

      // Stagger elements slightly for layering effect
      currentTime += duration * (0.5 + rng.range(-0.2, 0.2))
    }

    const totalDuration = elements.reduce((max, el) => Math.max(max, el.startTime + el.duration), 0)
    const backgroundIntensity = rng.range(0.1, 0.8)
    const colorShift = rng.range(0, 360)
    const audioIntensity = rng.range(0.5, 1.0)

    return {
      seed: seedHash,
      elements,
      totalDuration: Math.round(totalDuration * 10) / 10,
      backgroundIntensity,
      theme,
      colorShift,
      audioIntensity,
      hash: seedHash.slice(0, 16),
    }
  }, [seedHash, videos])
}
