/**
 * Vercel Serverless Function: Generate Metadata JSON
 */

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json()
    const { seed, seedPhrase, composition } = body

    if (!seed || !composition) {
      return Response.json({ error: 'Missing seed or composition data', received: { seed: !!seed, composition: !!composition } }, { status: 400 })
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecret = process.env.PINATA_API_SECRET

    // Debug info (remove in production)
    const debugInfo = {
      hasApiKey: !!pinataApiKey,
      hasSecret: !!pinataSecret,
      apiKeyLength: pinataApiKey?.length || 0,
      secretLength: pinataSecret?.length || 0,
      envKeys: Object.keys(process.env).filter(k => k.includes('PINATA')),
    }

    if (!pinataApiKey || !pinataSecret) {
      return Response.json({ 
        error: 'Pinata credentials not configured', 
        debug: debugInfo 
      }, { status: 500 })
    }

    const metadata = {
      name: `VideoDanza #${Math.floor(Math.random() * 100000)}`,
      description: 'Pieza generativa única de videodanza.',
      image: 'ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb',
      animation_url: `ipfs://${seed}`,
      attributes: [
        { trait_type: 'Seed', value: seedPhrase || seed },
        { trait_type: 'Theme', value: composition.theme },
        { trait_type: 'Layer Count', value: String(composition.layerCount) },
      ],
    }

    const pinataResponse = await fetch(PINATA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': pinataApiKey,
        'pinata_secret_api_key': pinataSecret,
      },
      body: JSON.stringify({ pinataContent: metadata }),
    })

    if (!pinataResponse.ok) {
      const errorText = await pinataResponse.text()
      return Response.json({ 
        error: `Pinata error: ${pinataResponse.status}`,
        pinataResponse: errorText,
        debug: debugInfo
      }, { status: 500 })
    }

    const data = await pinataResponse.json()

    return Response.json({
      success: true,
      metadataUrl: `ipfs://${data.IpfsHash}`,
      cid: data.IpfsHash,
      metadata,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    return Response.json({ 
      error: errorMessage, 
      stack: errorStack,
      type: error?.constructor?.name 
    }, { status: 500 })
  }
}
