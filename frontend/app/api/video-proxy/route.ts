import { NextRequest, NextResponse } from 'next/server'

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
    return new NextResponse('Missing uri parameter', { status: 400 })
  }

  // Extract CID from ipfs:// URI or use raw CID
  let cid = uri.replace('ipfs://', '')
  
  // Validate CID format
  if (!cid || cid.length < 10) {
    return new NextResponse('Invalid CID', { status: 400 })
  }

  // Try each gateway with timeout
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/${cid}`
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout for videos
      
      const response = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        continue
      }

      const contentType = response.headers.get('Content-Type') || 'video/mp4'

      // Stream the response
      return new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      continue
    }
  }

  // Return 404 instead of 500 when video not found
  return new NextResponse('Video not available', { status: 404 })
}
