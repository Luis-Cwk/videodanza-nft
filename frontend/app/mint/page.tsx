'use client'

import { MintCard } from '@/components/mint/MintCard'

export default function MintPage() {
  return (
    <div className="space-y-12">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Mint Your VideoDanza NFT
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">
          Create a unique generative dance video NFT using your personal seed phrase. Each seed generates a unique, deterministic video that can never be duplicated.
        </p>
      </div>

      <MintCard />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6">
          <div className="text-3xl mb-3">🎬</div>
          <h3 className="font-bold mb-2">Generative Art</h3>
          <p className="text-sm text-slate-400">
            Each NFT is algorithmically generated using your unique seed
          </p>
        </div>

        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6">
          <div className="text-3xl mb-3">🔐</div>
          <h3 className="font-bold mb-2">Deterministic</h3>
          <p className="text-sm text-slate-400">
            Same seed always produces the same video - no duplicates possible
          </p>
        </div>

        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6">
          <div className="text-3xl mb-3">🌍</div>
          <h3 className="font-bold mb-2">IPFS Stored</h3>
          <p className="text-sm text-slate-400">
            Your videos are stored on IPFS for permanent, decentralized access
          </p>
        </div>
      </div>
    </div>
  )
}
