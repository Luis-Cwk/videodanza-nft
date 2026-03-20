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
    return NextResponse.json({ error: 'Missing uri parameter' }, { status: 400 })
  }

  const cid = uri.replace('ipfs://', '')

  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}/${cid}`
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
        },
        redirect: 'follow',
      })

      if (!response.ok) {
        console.warn(`Gateway ${gateway} failed: ${response.status}`)
        continue
      }

      const contentType = response.headers.get('Content-Type') || ''
      
      if (contentType.includes('application/json')) {
        const data = await response.json()
        return NextResponse.json(data)
      } else {
        const text = await response.text()
        try {
          const data = JSON.parse(text)
          return NextResponse.json(data)
        } catch {
          console.warn(`Gateway ${gateway} returned non-JSON`)
          continue
        }
      }
    } catch (err) {
      console.warn(`Gateway ${gateway} error:`, err)
      continue
    }
  }

  return NextResponse.json({ error: 'Failed to fetch from all gateways. The content may have been garbage collected from IPFS.' }, { status: 500 })
}
