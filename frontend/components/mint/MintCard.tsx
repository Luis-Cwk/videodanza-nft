'use client'

import { useState, useEffect } from 'react'
import { useAccount } from 'wagmi'
import { useForm } from 'react-hook-form'
import { useMintNFT } from '@/lib/hooks/useContract'
import { useIPFSLookupTable } from '@/lib/hooks/useIPFS'
import { ethers } from 'ethers'

interface MintFormData {
  seedPhrase: string
}

export const MintCard = () => {
  const { isConnected } = useAccount()
  const { register, handleSubmit, watch, formState: { errors } } = useForm<MintFormData>()
  const [seed, setSeed] = useState<`0x${string}` | null>(null)
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const { videos, loading: videosLoading } = useIPFSLookupTable()
  const { mint, isPending, isSuccess, hash, error: mintError, status } = useMintNFT()
  // Temporarily disable contract reads to fix page rendering
  // const mintPrice = useMintPrice()
  // const isSeedMinted = useIsSeedMinted(seed || '0x0000000000000000000000000000000000000000000000000000000000000000')
  
  const seedPhrase = watch('seedPhrase')
  const mintPrice = '1000000000000000' // 0.001 ETH in wei
  const isSeedMinted = false

  // Generate seed from phrase
  useEffect(() => {
    if (seedPhrase && typeof seedPhrase === 'string' && seedPhrase.trim()) {
      try {
        const hashedSeed = ethers.keccak256(ethers.toUtf8Bytes(seedPhrase))
        setSeed(hashedSeed as `0x${string}`)
      } catch (err) {
        setSeed(null)
      }
    } else {
      setSeed(null)
    }
  }, [seedPhrase])

  // Handle successful mint
  useEffect(() => {
    if (isSuccess) {
      setSuccess(`NFT minted successfully! TX: ${hash}`)
      setTimeout(() => setSuccess(null), 5000)
    }
  }, [isSuccess, hash])

  const onSubmit = async (_data: MintFormData) => {
    try {
      setError(null)

      console.log('Form submitted', { isConnected, seed, selectedVideo, isSeedMinted })

      if (!isConnected) {
        setError('Please connect your wallet first')
        return
      }

      if (!seed) {
        setError('Invalid seed phrase')
        return
      }

      if (isSeedMinted) {
        setError('This seed has already been minted')
        return
      }

      if (!selectedVideo) {
        setError('Please select a video')
        return
      }

      // Get the IPFS gateway URL for the selected video
      console.log('Selected video:', selectedVideo)
      console.log('Videos data:', videos)
      console.log('Video metadata:', videos[selectedVideo])
      
      const videoData = videos[selectedVideo]
      if (!videoData) {
        setError('Could not find video metadata')
        return
      }
      
      const metadataURI = videoData.gateway
      if (!metadataURI) {
        setError('Could not find gateway URL')
        return
      }

      console.log('All validations passed, calling mint with:', { seed, metadataURI, mintPrice })
      await mint(seed, metadataURI, mintPrice)
      console.log('Mint called successfully')
    } catch (err) {
      console.error('Submit error:', err)
      setError(err instanceof Error ? err.message : 'Minting failed')
    }
  }

  const formattedPrice = mintPrice ? (Number(mintPrice) / 1e18).toFixed(4) : '0.001'

  return (
    <div className="bg-slate-900/50 backdrop-blur border border-purple-500/20 rounded-lg p-8 max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        Mint Your VideoDanza NFT
      </h2>

      {!isConnected && (
        <div className="bg-amber-900/20 border border-amber-500/30 rounded p-4 mb-6 text-amber-200">
          Please connect your wallet to mint an NFT
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Seed Phrase Input */}
        <div>
          <label htmlFor="seedPhrase" className="block text-sm font-medium mb-2">
            Seed Phrase
          </label>
          <input
            id="seedPhrase"
            type="text"
            placeholder="Enter any phrase (e.g., your name, a memory, coordinates)"
            className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            {...register('seedPhrase', { required: 'Seed phrase is required' })}
          />
          {errors.seedPhrase && (
            <p className="text-red-400 text-sm mt-1">{errors.seedPhrase.message}</p>
          )}
          {seed && (
            <p className="text-xs text-slate-400 mt-1">
              Seed: {seed.slice(0, 10)}...{seed.slice(-8)}
            </p>
          )}
        </div>

        {/* Video Selection */}
        <div>
          <label htmlFor="video" className="block text-sm font-medium mb-2">
            Choose Video
          </label>
          {videosLoading ? (
            <div className="text-slate-400">Loading videos...</div>
          ) : (
            <select
              id="video"
              value={selectedVideo}
              onChange={(e) => setSelectedVideo(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
            >
              <option value="">Select a video...</option>
              {Object.keys(videos).map((videoName) => (
                <option key={videoName} value={videoName}>
                  {videoName.replace(/\.mp4/, '').slice(0, 50)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Mint Info */}
        <div className="bg-slate-800/50 rounded p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Mint Price</span>
            <span className="font-mono">{formattedPrice} ETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Status</span>
            <span className={seed && isSeedMinted ? 'text-orange-400' : 'text-green-400'}>
              {!seed ? 'Enter a seed' : isSeedMinted ? 'Already minted' : 'Ready to mint'}
            </span>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-red-200 text-sm">
            {error}
          </div>
        )}
        {mintError && (
          <div className="bg-red-900/20 border border-red-500/30 rounded p-4 text-red-200 text-sm">
            Contract Error: {mintError.message || 'Unknown error'}
          </div>
        )}
        {status && status !== 'idle' && (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4 text-blue-200 text-sm">
            Transaction Status: {status}
            {hash && <div className="mt-2">TX Hash: {hash}</div>}
          </div>
        )}
        {success && (
          <div className="bg-green-900/20 border border-green-500/30 rounded p-4 text-green-200 text-sm">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={Boolean(!isConnected || isPending || !seed || !selectedVideo || (seed && isSeedMinted))}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded transition-all duration-200"
        >
          {isPending ? 'Processing Transaction...' : !isConnected ? 'Connect Wallet to Mint' : !seed ? 'Enter Seed Phrase' : !selectedVideo ? 'Select a Video' : 'Mint NFT'}
        </button>
      </form>
    </div>
  )
}
