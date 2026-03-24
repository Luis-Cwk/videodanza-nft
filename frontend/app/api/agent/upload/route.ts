export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { videoBase64, movementType, style, colorPalette } = body

    if (!videoBase64) {
      return new Response(JSON.stringify({ error: 'Missing video data' }), {
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

    const pinataHeaders = {
      'pinata_api_key': pinataApiKey,
      'pinata_secret_api_key': pinataSecret,
    }

    // Subir video a IPFS
    const videoBuffer = Buffer.from(videoBase64, 'base64')
    const videoFormData = new FormData()
    videoFormData.append('file', new Blob([videoBuffer], { type: 'video/webm' }), 'somaagent.webm')

    const videoResp = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: pinataHeaders,
      body: videoFormData,
    })

    if (!videoResp.ok) {
      const errorText = await videoResp.text()
      return new Response(JSON.stringify({
        error: `Pinata upload failed: ${videoResp.status}`,
        details: errorText
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const videoData = await videoResp.json()
    const videoCid = videoData.IpfsHash

    // Subir metadata
    const metadata = {
      name: `SomaDanza - ${style || 'autonomous'}`,
      description: `Videodanza generativa creada autonomamente por SomaAgent. Movimiento: ${movementType || 'unknown'}. Estilo: ${style || 'unknown'}.`,
      image: `ipfs://${videoCid}`,
      animation_url: `ipfs://${videoCid}`,
      attributes: [
        { trait_type: 'Movement Type', value: movementType || 'unknown' },
        { trait_type: 'Art Style', value: style || 'unknown' },
        { trait_type: 'Color Palette', value: colorPalette || 'unknown' },
        { trait_type: 'Agent', value: 'SomaAgent' },
        { trait_type: 'GPU', value: 'Modal T4' },
        { trait_type: 'Model', value: 'SDXL Turbo' },
        { trait_type: 'Generated', value: new Date().toISOString() },
      ],
      external_url: 'https://github.com/Luis-Cwk/somaagent',
    }

    const metaResp = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: { ...pinataHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ pinataContent: metadata }),
    })

    let metadataCid = null
    if (metaResp.ok) {
      const metaData = await metaResp.json()
      metadataCid = metaData.IpfsHash
    }

    return new Response(JSON.stringify({
      success: true,
      cid: videoCid,
      metadataCid,
      videoUrl: `https://gateway.pinata.cloud/ipfs/${videoCid}`,
      metadataUrl: metadataCid ? `https://gateway.pinata.cloud/ipfs/${metadataCid}` : null,
      metadata,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Upload error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
