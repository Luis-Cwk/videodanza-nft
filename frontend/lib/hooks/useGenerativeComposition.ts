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
  zIndex: number
}

export interface GenerativeComposition {
  seed: string
  elements: CompositionElement[]
  totalDuration: number
  backgroundIntensity: number
  theme: 'geometric' | 'organic' | 'hybrid' | 'glitch' | 'cinematic' | 'abstract' | 'kinetic'
  colorShift: number
  audioIntensity: number
  hash: string
  layerCount: number
  videoUrl?: string // IPFS URL of the generated video
  thumbnailUrl?: string // IPFS URL of the first frame/thumbnail
}

class SeededRandom {
  private seed: number

  constructor(seedStr: string) {
    this.seed = parseInt(seedStr.slice(2, 10), 16) || 0
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

  choices<T>(arr: T[], count: number): T[] {
    const indices = new Set<number>()
    while (indices.size < Math.min(count, arr.length)) {
      indices.add(Math.floor(this.next() * arr.length))
    }
    return Array.from(indices).map((i) => arr[i])
  }

  boolean(probability = 0.5): boolean {
    return this.next() < probability
  }

  integer(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1))
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
    const videoCount = videoKeys.length

    const themes: Array<'geometric' | 'organic' | 'hybrid' | 'glitch' | 'cinematic' | 'abstract' | 'kinetic'> = [
      'geometric',
      'organic',
      'hybrid',
      'glitch',
      'cinematic',
      'abstract',
      'kinetic',
    ]
    const theme = rng.choice(themes)

    // Layer count: 5 to min(25, available videos)
    const minLayers = Math.max(5, Math.min(videoCount, 5))
    const maxLayers = Math.min(25, videoCount)
    const layerCount = rng.integer(minLayers, maxLayers)

    // Select unique videos for this composition
    const selectedVideoKeys = rng.choices(videoKeys, layerCount)

    // Generate composition elements
    const elements: CompositionElement[] = []
    let currentTime = 0
    const baseElementDuration = rng.range(2, 6)

    for (let i = 0; i < selectedVideoKeys.length; i++) {
      const videoKey = selectedVideoKeys[i]
      const videoData = videos[videoKey]

      if (!videoData) continue

      const duration = baseElementDuration + rng.range(-1, 2)
      const scale = rng.range(0.4, 2.0)
      const opacity = rng.range(0.2, 1.0)
      const rotation = rng.range(0, 360)
      const positionX = rng.range(-30, 130)
      const positionY = rng.range(-30, 130)

      const blendModes = [
        'normal',
        'multiply',
        'screen',
        'overlay',
        'color-dodge',
        'darken',
        'lighten',
        'soft-light',
        'hard-light',
        'difference',
      ]
      const blendMode = rng.choice(blendModes)

      const effectId = rng.integer(0, 8)
      const zIndex = i

      elements.push({
        videoKey,
        videoName: videoKey.replace(/\.mp4/, '').slice(0, 20),
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
        zIndex,
      })

      currentTime += duration * (0.3 + rng.range(-0.15, 0.3))
    }

    const totalDuration = Math.max(
      10,
      elements.reduce((max, el) => Math.max(max, el.startTime + el.duration), 0)
    )

    const backgroundIntensity = rng.range(0.05, 0.9)
    const colorShift = rng.range(0, 360)
    const audioIntensity = rng.range(0.3, 1.0)

    return {
      seed: seedHash,
      elements,
      totalDuration: Math.round(totalDuration * 10) / 10,
      backgroundIntensity,
      theme,
      colorShift,
      audioIntensity,
      hash: seedHash.slice(0, 16),
      layerCount: selectedVideoKeys.length,
    }
  }, [seedHash, videos])
}
