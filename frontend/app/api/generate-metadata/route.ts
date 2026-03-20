/**
 * Vercel Serverless Function: Generate Metadata JSON
 */

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

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

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as {
      seed: string
      seedPhrase?: string
      composition: GenerativeComposition
    }

    const { seed, seedPhrase, composition } = body

    if (!seed || !composition) {
      return Response.json({ error: 'Missing seed or composition data' }, { status: 400 })
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecret = process.env.PINATA_API_SECRET

    if (!pinataApiKey || !pinataSecret) {
      return Response.json({ error: 'Pinata credentials not configured' }, { status: 500 })
    }

    const metadata = {
      name: `VideoDanza #${Math.floor(Math.random() * 100000)}`,
      description: 'Pieza generativa única de videodanza. Composición determinística creada a partir de una semilla única.',
      image: 'ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb',
      animation_url: `ipfs://${seed}`,
      attributes: [
        { trait_type: 'Seed', value: seedPhrase || seed },
        { trait_type: 'Theme', value: composition.theme },
        { trait_type: 'Layer Count', value: composition.layerCount.toString() },
        { trait_type: 'Videos Base', value: composition.elements.slice(0, 3).map((el: CompositionElement) => el.videoName).join(', ') },
        { trait_type: 'Background Intensity', value: composition.backgroundIntensity.toFixed(2) },
        { trait_type: 'Audio Intensity', value: composition.audioIntensity.toFixed(2) },
      ],
    }

    const response = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        pinata_api_key: pinataApiKey,
        pinata_secret_api_key: pinataSecret,
      },
      body: JSON.stringify({ pinataContent: metadata }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return Response.json({ error: `Pinata error: ${response.status} - ${errorText}` }, { status: 500 })
    }

    const data = (await response.json()) as { IpfsHash: string }
    const metadataUrl = `ipfs://${data.IpfsHash}`

    return Response.json({
      success: true,
      metadataUrl,
      cid: data.IpfsHash,
      metadata,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
