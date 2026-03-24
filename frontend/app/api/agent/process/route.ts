export const runtime = 'edge'

const MODAL_ENDPOINT = 'https://luis-cwk--somaagent-streamdiffusion-process-web.modal.run'

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const videoFile = formData.get('video') as File
    const prompt = formData.get('prompt') as string
    const negativePrompt = formData.get('negativePrompt') as string
    const strength = parseFloat(formData.get('strength') as string || '0.55')
    const movementType = formData.get('movementType') as string
    const style = formData.get('style') as string
    const colorPalette = formData.get('colorPalette') as string

    if (!videoFile || !prompt) {
      return new Response(JSON.stringify({ error: 'Missing video or prompt' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Convertir video a base64
    const arrayBuffer = await videoFile.arrayBuffer()
    const videoBase64 = Buffer.from(arrayBuffer).toString('base64')

    const startTime = Date.now()

    // Llamar a Modal para procesar
    const modalResponse = await fetch(MODAL_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_bytes_base64: videoBase64.substring(0, Math.min(videoBase64.length, 200000)),
        prompt,
        negative_prompt: negativePrompt || '',
        strength,
      }),
    })

    const processingTime = ((Date.now() - startTime) / 1000).toFixed(1)

    if (!modalResponse.ok) {
      // Si Modal falla, devolver video original con metadata
      console.log('Modal unavailable, returning original video')
      return new Response(JSON.stringify({
        success: true,
        videoBase64,
        processingTime: parseFloat(processingTime),
        movementType,
        style,
        colorPalette,
        prompt,
        note: 'Original (Modal unavailable)',
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await modalResponse.json()

    return new Response(JSON.stringify({
      success: true,
      videoBase64: result.image_base64 || videoBase64,
      processingTime: parseFloat(processingTime),
      movementType,
      style,
      colorPalette,
      prompt,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Process error:', error)
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
