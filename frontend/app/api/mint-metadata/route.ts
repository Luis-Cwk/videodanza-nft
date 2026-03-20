export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { seed, seedPhrase, composition } = body

    if (!seed || !composition) {
      return new Response(JSON.stringify({ error: 'Missing data' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const pinataApiKey = process.env.PINATA_API_KEY
    const pinataSecret = process.env.PINATA_API_SECRET

    if (!pinataApiKey || !pinataSecret) {
      return new Response(JSON.stringify({ 
        error: 'Pinata credentials not configured'
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const metadata = {
      name: `VideoDanza #${Math.floor(Math.random() * 100000)}`,
      description: 'Pieza generativa de videodanza.',
      image: 'ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb',
      animation_url: `ipfs://${seed}`,
      attributes: [
        { trait_type: 'Seed', value: seedPhrase || seed },
        { trait_type: 'Theme', value: composition.theme },
        { trait_type: 'Layer Count', value: String(composition.layerCount) },
      ],
    }

    const pinataResponse = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
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
      return new Response(JSON.stringify({ 
        error: `Pinata failed: ${pinataResponse.status}`,
        details: errorText
      }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await pinataResponse.json()

    return new Response(JSON.stringify({
      success: true,
      metadataUrl: `ipfs://${data.IpfsHash}`,
      cid: data.IpfsHash,
      metadata,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error'
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
