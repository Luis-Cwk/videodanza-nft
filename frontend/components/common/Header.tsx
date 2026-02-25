'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'

export const Header = () => {
  return (
    <nav className="minimal-nav" style={{ marginBottom: '40px' }}>
      <Link href="/" className="brand">
        PETRA
      </Link>

      <div className="nav-links">
        <Link href="/">Arte</Link>
        <Link href="/gallery">Galería</Link>
        <Link href="/mint" className="featured">
          Mint NFT
        </Link>
        <div style={{ marginLeft: '15px', borderLeft: '1px solid #000', paddingLeft: '15px' }}>
          <WalletConnect />
        </div>
      </div>
    </nav>
  )
}
