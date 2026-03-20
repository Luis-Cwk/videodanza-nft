/**
 * Vercel Serverless Function: Generate Metadata JSON
 * 
 * Este endpoint genera metadata JSON completa para cada composición generativa
 * con TODOS los datos necesarios para reproducir la pieza exactamente igual.
 * Se sube automáticamente a IPFS y retorna el CID.
 */

import type { NextApiRequest, NextApiResponse } from 'next'

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

interface CompositionElement {
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

interface GenerativeComposition {
  seed: string
  elements: CompositionElement[]
  totalDuration: number
  backgroundIntensity: number
  theme: string
  colorShift: number
  audioIntensity: number
  hash: string
  layerCount: number
}

type ResponseData =
  | { success: true; metadataUrl: string; cid: string; metadata: unknown }
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { seed, seedPhrase, composition } = req.body as {
      seed: string
      seedPhrase?: string
      composition: GenerativeComposition
    }

    if (!seed || !composition) {
      return res.status(400).json({ error: 'Missing seed or composition data' })
    }

    const metadata = {
      name: `VideoDanza #${Math.floor(Math.random() * 100000)}`,
      description: 'Pieza generativa única de videodanza. Composición determinística creada a partir de una semilla única.',
      image: 'ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb',
      animation_url: `ipfs://${seed}`,
      seed: seed,
      seedPhrase: seedPhrase || '',
      theme: composition.theme,
      layerCount: composition.layerCount,
      totalDuration: composition.totalDuration,
      backgroundIntensity: composition.backgroundIntensity,
      colorShift: composition.colorShift,
      audioIntensity: composition.audioIntensity,
      elements: composition.elements.map((el: CompositionElement) => ({
        videoKey: el.videoKey,
        videoName: el.videoName,
        ipfsUri: el.ipfsUri,
        startTime: el.startTime,
        duration: el.duration,
        scale: el.scale,
        opacity: el.opacity,
        rotation: el.rotation,
        positionX: el.positionX,
        positionY: el.positionY,
        blendMode: el.blendMode,
        effectId: el.effectId,
        zIndex: el.zIndex,
      })),
      attributes: [
        { trait_type: 'Seed', value: seedPhrase || seed },
        { trait_type: 'Theme', value: composition.theme },
        { trait_type: 'Layer Count', value: composition.layerCount.toString() },
        { trait_type: 'Duration', value: composition.totalDuration.toFixed(1) + 's' },
        { trait_type: 'Background Intensity', value: composition.backgroundIntensity.toFixed(2) },
        { trait_type: 'Audio Intensity', value: composition.audioIntensity.toFixed(2) },
        { trait_type: 'Color Shift', value: Math.round(composition.colorShift).toString() },
      ],
      _version: '2.0',
      _generatedAt: new Date().toISOString(),
    }

    const jsonBlob = Buffer.from(JSON.stringify(metadata, null, 2))
    const formData = new FormData()
    formData.append(
      'file',
      new Blob([jsonBlob], { type: 'application/json' }),
      `metadata-${Date.now()}.json`
    )

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecret = process.env.PINATA_API_SECRET

    if (!pinataApiKey || !pinataSecret) {
      return res.status(500).json({ error: 'Pinata credentials not configured' })
    }

    const response = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecret,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Pinata error:', errorData)
      return res.status(500).json({ error: 'Failed to upload metadata to IPFS' })
    }

    const data = (await response.json()) as { IpfsHash: string }
    const metadataUrl = `ipfs://${data.IpfsHash}`

    res.status(200).json({
      success: true,
      metadataUrl,
      cid: data.IpfsHash,
      metadata,
    })
  } catch (error) {
    console.error('Metadata generation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: errorMessage })
  }
}
