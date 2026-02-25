'use client'

import { useState, useEffect } from 'react'

const GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs'

// Type definitions
interface VideoMetadata {
  cid: string
  ipfs: string
  gateway: string
  fileSize: number
  uploadTime: string
}

interface IPFSLookupTable {
  network: string
  chainId: number
  contractAddress: string
  timestamp: string
  gateway: string
  videos: Record<string, VideoMetadata>
}

// Load lookup table from public folder (static data, no API call needed)
let lookupTableCache: IPFSLookupTable | null = null

const loadLookupTable = async (): Promise<IPFSLookupTable> => {
  if (lookupTableCache !== null) {
    return lookupTableCache
  }

  try {
    const response = await fetch('/ipfs_lookup_table.json')
    if (!response.ok) {
      throw new Error('Failed to load IPFS lookup table')
    }
    const data = await response.json() as IPFSLookupTable
    lookupTableCache = data
    return lookupTableCache
  } catch (err) {
    console.error('Error loading IPFS lookup table:', err)
    // Return empty table as fallback
    const fallback: IPFSLookupTable = {
      network: 'sepolia',
      chainId: 11155111,
      contractAddress: '0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf',
      timestamp: new Date().toISOString(),
      gateway: GATEWAY_URL,
      videos: {}
    }
    lookupTableCache = fallback
    return fallback
  }
}

export const useIPFSLookupTable = () => {
  const [videos, setVideos] = useState<Record<string, VideoMetadata>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLookupTable = async () => {
      try {
        const table = await loadLookupTable()
        setVideos(table.videos)
      } catch (err) {
        console.error('Failed to load IPFS lookup table:', err)
        setError('Failed to load video mappings')
      } finally {
        setLoading(false)
      }
    }

    fetchLookupTable()
  }, [])

  return { videos, loading, error }
}

export const useIPFSVideo = (videoName: string) => {
  const [cid, setCID] = useState<string | null>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!videoName) {
      setLoading(false)
      return
    }

    const fetchVideoInfo = async () => {
      try {
        const table = await loadLookupTable()
        const videoMetadata = table.videos[videoName]

        if (!videoMetadata) {
          throw new Error(`Video not found: ${videoName}`)
        }

        setCID(videoMetadata.cid)
        setUrl(videoMetadata.gateway)
      } catch (err) {
        console.error('Failed to fetch IPFS video info:', err)
        setError('Failed to load video')
      } finally {
        setLoading(false)
      }
    }

    fetchVideoInfo()
  }, [videoName])

  return { cid, url, loading, error }
}

export const getIPFSUrl = (cid: string): string => {
  return `${GATEWAY_URL}/${cid}`
}
