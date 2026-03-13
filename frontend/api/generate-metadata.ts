/**
 * Vercel Serverless Function: Generate Metadata JSON
 * 
 * Este endpoint genera metadata JSON para cada composición generativa
 * y la sube automáticamente a IPFS usando las credenciales del backend
 */

import type { NextApiRequest, NextApiResponse } from 'next'

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

interface CompositionElement {
  videoName: string
  [key: string]: unknown
}

interface GenerativeComposition {
  theme: string
  layerCount: number
  backgroundIntensity: number
  audioIntensity: number
  elements: CompositionElement[]
}

type ResponseData =
  | { success: true; metadataUrl: string; cid: string; metadata: unknown }
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Solo POST
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

    // Generar metadata JSON
    const metadata = {
      name: `VideoDanza #${Math.floor(Math.random() * 100000)}`,
      description: 'Pieza generativa única de videodanza. Composición determinística creada a partir de una semilla única.',
      image: 'ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb', // Thumbnail placeholder
      animation_url: `ipfs://${seed}`, // Los parámetros de la composición
      attributes: [
        {
          trait_type: 'Seed',
          value: seedPhrase || seed,
        },
        {
          trait_type: 'Theme',
          value: composition.theme,
        },
        {
          trait_type: 'Layer Count',
          value: composition.layerCount.toString(),
        },
        {
          trait_type: 'Videos Base',
          value: composition.elements
            .slice(0, 3)
            .map((el: CompositionElement) => el.videoName)
            .join(', '),
        },
        {
          trait_type: 'Background Intensity',
          value: composition.backgroundIntensity.toFixed(2),
        },
        {
          trait_type: 'Audio Intensity',
          value: composition.audioIntensity.toFixed(2),
        },
      ],
    }

    // Subir metadata a IPFS
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

    // Hacer request a Pinata
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
