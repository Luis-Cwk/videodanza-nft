export async function POST(_req: Request) {
  return new Response(JSON.stringify({
    success: true,
    message: 'API working',
    hasKey: !!process.env.PINATA_API_KEY,
    hasSecret: !!process.env.PINATA_API_SECRET,
    envVars: Object.keys(process.env).filter(k => k.includes('PINATA'))
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  })
}
