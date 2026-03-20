export const runtime = 'edge'

export async function POST(_req: Request) {
  return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

export async function GET(_req: Request) {
  return new Response(JSON.stringify({ status: 'ok', time: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  })
}
