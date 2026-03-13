import { NextRequest, NextResponse } from 'next/server'

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ cid: string }> }
) {
  const { cid } = await params

  if (!cid) {
    return NextResponse.json({ error: 'CID is required' }, { status: 400 })
  }

  try {
    const response = await fetch(`${PINATA_GATEWAY}/${cid}`, {
      headers: {
        'Range': request.headers.get('Range') || '',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from IPFS: ${response.status}` },
        { status: response.status }
      )
    }

    const headers = new Headers()
    headers.set('Content-Type', response.headers.get('Content-Type') || 'video/mp4')
    headers.set('Content-Length', response.headers.get('Content-Length') || '')
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Cache-Control', 'public, max-age=86400')

    return new NextResponse(response.body, {
      status: 200,
      headers,
    })
  } catch (error) {
    console.error('IPFS proxy error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}
