'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

const GATEWAY_URL = 'https://gateway.pinata.cloud/ipfs'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const useIPFSLookupTable = () => {
  const [videos, setVideos] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLookupTable = async () => {
      try {
        const response = await axios.get(`${API_BASE}/ipfs/lookup-table`)
        setVideos(response.data)
      } catch (err) {
        console.error('Failed to fetch IPFS lookup table:', err)
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
        const cidResponse = await axios.get(`${API_BASE}/ipfs/cid/${videoName}`)
        const fetchedCID = cidResponse.data.cid

        setCID(fetchedCID)
        setUrl(`${GATEWAY_URL}/${fetchedCID}`)
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
