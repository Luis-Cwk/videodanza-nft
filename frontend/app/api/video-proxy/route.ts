import { NextRequest, NextResponse } from 'next/server'

const IPFS_GATEWAYS = [
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

  const cid = uri.replace('ipfs://', '')

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/${cid}`
      const response = await fetch(url, {
        redirect: 'follow',
      })

      if (!response.ok) {
        console.warn(`Gateway ${gateway} failed: ${response.status}`)
        continue
      }

      const contentType = response.headers.get('Content-Type') || 'video/mp4'

      return new NextResponse(response.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
        },
      })
    } catch (err) {
      console.warn(`Gateway ${gateway} error:`, err)
      continue
    }
  }

  return new NextResponse('Failed to fetch from all gateways', { status: 500 })
}
