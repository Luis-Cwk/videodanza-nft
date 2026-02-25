'use client'

import { useState } from 'react'
import { GenerativeComposition } from './useGenerativeComposition'

const PINATA_API_URL = 'https://api.pinata.cloud/pinning/pinFileToIPFS'

interface MetadataJSON {
  name: string
  description: string
  image: string
  animation_url: string
  attributes: Array<{
    trait_type: string
    value: string
  }>
}

export const useMetadataUpload = () => {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateMetadata = (
    composition: GenerativeComposition,
    seedPhrase: string,
    tokenId?: number
  ): MetadataJSON => {
    const videoNames = composition.elements
      .map((el) => el.videoName)
      .join(', ')
      .slice(0, 100)

    return {
      name: `VideoDanza${tokenId ? ` #${tokenId}` : ''}`,
      description: `Pieza generativa única de videodanza. Composición determinística creada a partir de una semilla única.`,
      image: composition.thumbnailUrl || 'ipfs://QmajZaDfCnZzGGqZEJKdEaKDYVQd1qXnbMz8x4NHUcmBb', // Placeholder
      animation_url: composition.videoUrl || '',
      attributes: [
        {
          trait_type: 'Seed',
          value: seedPhrase,
        },
        {
          trait_type: 'Theme',
          value: composition.theme,
        },
        {
          trait_type: 'Layer Count',
          value: composition.layerCount.toString(),
        },
        {
          trait_type: 'Videos Base',
          value: videoNames,
        },
        {
          trait_type: 'Background Intensity',
          value: composition.backgroundIntensity.toFixed(2),
        },
        {
          trait_type: 'Audio Intensity',
          value: composition.audioIntensity.toFixed(2),
        },
      ],
    }
  }

  const uploadMetadataJSON = async (
    metadata: MetadataJSON,
    pinataApiKey: string,
    pinataSecretKey: string
  ): Promise<string | null> => {
    setUploading(true)
    setError(null)

    try {
      // Create JSON blob
      const jsonBlob = new Blob([JSON.stringify(metadata, null, 2)], {
        type: 'application/json',
      })

      // Create FormData with JSON file
      const formData = new FormData()
      const fileName = `metadata-${Date.now()}.json`
      formData.append('file', jsonBlob, fileName)

      // Upload to Pinata
      const response = await fetch(PINATA_API_URL, {
        method: 'POST',
        headers: {
          pinata_api_key: pinataApiKey,
          pinata_secret_api_key: pinataSecretKey,
        },
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to upload metadata to Pinata')
      }

      const data = await response.json()
      const metadataUrl = `ipfs://${data.IpfsHash}`

      setUploading(false)
      return metadataUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      setUploading(false)
      return null
    }
  }

  return {
    generateMetadata,
    uploadMetadataJSON,
    uploading,
    error,
  }
}
