import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

const IPFS_GATEWAYS = [
  'https://ipfs.filebase.io/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://nftstorage.link/ipfs',
  'https://dweb.link/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const uri = searchParams.get('uri')

  if (!uri) {
    return NextResponse.json({ error: 'Missing uri parameter' }, { status: 400 })
  }

  // Extract CID from ipfs:// URI or use raw CID
  let cid = uri.replace('ipfs://', '')
  
  // Validate CID format (basic check)
  if (!cid || cid.length < 10) {
    return NextResponse.json({ error: 'Invalid CID' }, { status: 400 })
  }

  // Try each gateway with timeout
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/${cid}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json, */*',
        },
        redirect: 'follow',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        continue
      }

      const contentType = response.headers.get('Content-Type') || ''
      
      if (contentType.includes('application/json')) {
        const data = await response.json()
        return NextResponse.json(data, {
          headers: {
            'Cache-Control': 'public, max-age=3600',
            'Access-Control-Allow-Origin': '*',
          },
        })
      } else {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          return NextResponse.json(data, {
            headers: {
              'Cache-Control': 'public, max-age=3600',
              'Access-Control-Allow-Origin': '*',
            },
          })
        } catch {
          continue
        }
      }
    } catch (err) {
      continue
    }
  }

  // Return fallback metadata instead of error
  // This prevents the page from breaking when IPFS content is not available
  return NextResponse.json({
    name: 'VideoDanza',
    description: 'Contenido temporalmente no disponible',
    image: null,
    animation_url: null,
    attributes: [],
    _fallback: true,
  }, {
    headers: {
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
