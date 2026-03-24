'use client'

import { useState, useEffect } from 'react'

const DEFAULT_GATEWAY = 'https://ipfs.filebase.io/ipfs'

interface VideoMetadata {
  cid: string
  ipfs: string
  gateway: string
  fileSize?: number
  uploadTime?: string
}

interface IPFSLookupTable {
  network: string
  chainId: number
  contractAddress: string
  timestamp?: string
  gateway: string
  videos: Record<string, VideoMetadata>
}

let lookupTableCache: IPFSLookupTable | null = null

const loadLookupTable = async (): Promise<IPFSLookupTable> => {
  if (lookupTableCache !== null) {
    return lookupTableCache
  }

  try {
    const response = await fetch(`/ipfs_lookup_table.json?t=${Date.now()}`, {
      cache: 'no-store'
    })
    if (!response.ok) {
      throw new Error('Failed to load IPFS lookup table')
    }
    const data = await response.json() as IPFSLookupTable
    lookupTableCache = data
    return lookupTableCache
  } catch (err) {
    console.error('Error loading IPFS lookup table:', err)
    const fallback: IPFSLookupTable = {
      network: 'sepolia',
      chainId: 11155111,
      contractAddress: '0xe3145Ad5b6889DEd5659aC07051BD513Ae32B828',
      gateway: DEFAULT_GATEWAY,
      videos: {}
    }
    lookupTableCache = fallback
    return fallback
  }
}

export const useIPFSLookupTable = () => {
  const [videos, setVideos] = useState<Record<string, VideoMetadata>>({})
  const [gateway, setGateway] = useState<string>(DEFAULT_GATEWAY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    lookupTableCache = null
    const fetchLookupTable = async () => {
      try {
        const table = await loadLookupTable()
        setVideos(table.videos)
        setGateway(table.gateway || DEFAULT_GATEWAY)
      } catch (err) {
        console.error('Failed to load IPFS lookup table:', err)
        setError('Failed to load video mappings')
      } finally {
        setLoading(false)
      }
    }

    fetchLookupTable()
  }, [])

  return { videos, gateway, loading, error }
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
          console.warn(`Video not found: ${videoName}, available videos:`, Object.keys(table.videos))
          setError(`Video not found: ${videoName}`)
          setLoading(false)
          return
        }

        setCID(videoMetadata.cid)
        setUrl(videoMetadata.gateway || `${table.gateway}/${videoMetadata.cid}`)
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

export const getIPFSUrl = (cid: string, gatewayUrl?: string): string => {
  const gateway = gatewayUrl || lookupTableCache?.gateway || DEFAULT_GATEWAY
  return `${gateway}/${cid}`
}
