'use client'

export default function HomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center py-20">
        <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          VideoDanza NFT
        </h1>
        <p className="text-2xl text-slate-300 mb-8 max-w-3xl mx-auto">
          Generative Dance Video NFTs on Sepolia Ethereum
        </p>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
          Create unique, deterministic video art using blockchain technology and IPFS storage. Each seed phrase generates a unique generative dance video that lives forever on the decentralized web.
        </p>

        <div className="flex flex-wrap gap-4 justify-center">
          <a
            href="/mint"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all duration-200"
          >
            Start Minting
          </a>
          <a
            href="/gallery"
            className="px-8 py-3 border border-purple-500 text-purple-400 hover:bg-purple-500/10 font-bold rounded-lg transition-all duration-200"
          >
            View Gallery
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all duration-200">
          <div className="text-4xl mb-4">🎨</div>
          <h3 className="text-lg font-bold mb-2">Generative</h3>
          <p className="text-sm text-slate-400">
            Algorithmically generated videos using your seed phrase
          </p>
        </div>

        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all duration-200">
          <div className="text-4xl mb-4">🔐</div>
          <h3 className="text-lg font-bold mb-2">Deterministic</h3>
          <p className="text-sm text-slate-400">
            Same seed always = same video. No duplicates possible
          </p>
        </div>

        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all duration-200">
          <div className="text-4xl mb-4">🌍</div>
          <h3 className="text-lg font-bold mb-2">Decentralized</h3>
          <p className="text-sm text-slate-400">
            Videos stored on IPFS, contracts on Ethereum
          </p>
        </div>

        <div className="bg-slate-900/30 border border-purple-500/20 rounded-lg p-6 hover:border-purple-500/40 transition-all duration-200">
          <div className="text-4xl mb-4">💰</div>
          <h3 className="text-lg font-bold mb-2">Affordable</h3>
          <p className="text-sm text-slate-400">
            0.001 ETH per mint + 7.5% creator royalties
          </p>
        </div>
      </div>

      {/* How It Works */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          How It Works
        </h2>

        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                1
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Connect Your Wallet</h3>
              <p className="text-slate-400">
                Connect MetaMask or another Ethereum wallet to access Sepolia testnet
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                2
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Choose Your Seed</h3>
              <p className="text-slate-400">
                Enter any phrase - your name, coordinates, a memory, whatever inspires you
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                3
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Select a Video</h3>
              <p className="text-slate-400">
                Browse our collection and select the video template for your NFT
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold">
                4
              </div>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-2">Mint Your NFT</h3>
              <p className="text-slate-400">
                Complete the transaction (0.001 ETH) and your NFT is permanently yours
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Built With
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            'Ethereum',
            'Solidity',
            'Sepolia Testnet',
            'IPFS',
            'Pinata',
            'Next.js',
            'Wagmi',
            'RainbowKit',
            'Tailwind CSS',
          ].map((tech) => (
            <div
              key={tech}
              className="bg-slate-900/30 border border-purple-500/20 rounded p-4 text-center font-medium hover:border-purple-500/40 transition-all duration-200"
            >
              {tech}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
