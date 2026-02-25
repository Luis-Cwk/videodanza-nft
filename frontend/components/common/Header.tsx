'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950 border-b border-purple-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              VideoDanza
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/mint" className="hover:text-purple-400">
              Mint NFT
            </Link>
            <Link href="/gallery" className="hover:text-purple-400">
              Gallery
            </Link>
          </nav>

          <WalletConnect />
        </div>
      </div>
    </header>
  )
}
