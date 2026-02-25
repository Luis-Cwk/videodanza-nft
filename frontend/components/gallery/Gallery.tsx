'use client'

import { useState } from 'react'
import { useIPFSLookupTable, getIPFSUrl } from '@/lib/hooks/useIPFS'

export const Gallery = () => {
  const { videos, loading, error } = useIPFSLookupTable()
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse">
          <div className="w-64 h-64 bg-slate-700 rounded-lg" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-900/20 border border-red-500/30 rounded p-6 text-red-200">
          {error}
        </div>
      </div>
    )
  }

  const videoList = Object.entries(videos)

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          VideoDanza Gallery
        </h1>
        <p className="text-slate-400">Explore available videos for minting</p>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videoList.map(([name, cid]) => (
          <div
            key={name}
            onClick={() => setSelectedVideo(name)}
            className="group cursor-pointer bg-slate-900/50 border border-purple-500/20 rounded-lg overflow-hidden hover:border-purple-500/50 transition-all duration-200"
          >
            <div className="aspect-video bg-slate-800 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 group-hover:from-purple-500/40 group-hover:to-pink-500/40 transition-all duration-200 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎬</div>
                  <p className="text-sm text-slate-300">{name.replace(/\.mp4/, '')}</p>
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-xs text-slate-500 font-mono truncate">CID: {cid.slice(0, 20)}...</p>
              <button
                className="mt-3 w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded text-sm font-medium transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedVideo(name)
                }}
              >
                Select
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Video Preview */}
      {selectedVideo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-purple-500/30 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-purple-500/20 bg-slate-900">
              <h3 className="text-xl font-bold">{selectedVideo.replace(/\.mp4/, '')}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="text-2xl hover:text-purple-400 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              <video
                src={getIPFSUrl(videos[selectedVideo])}
                controls
                className="w-full rounded-lg bg-black"
                controlsList="nodownload"
              />

              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-sm text-slate-400 mb-2">IPFS CID</p>
                  <p className="font-mono text-sm break-all bg-slate-800 p-3 rounded border border-slate-700">
                    {videos[selectedVideo]}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-2">IPFS Gateway URL</p>
                  <p className="font-mono text-sm break-all bg-slate-800 p-3 rounded border border-slate-700">
                    {getIPFSUrl(videos[selectedVideo])}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
