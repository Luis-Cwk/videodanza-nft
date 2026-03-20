export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    return new Response(JSON.stringify({
      received: body,
      env: {
        hasKey: !!process.env.PINATA_API_KEY,
        hasSecret: !!process.env.PINATA_API_SECRET
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}
