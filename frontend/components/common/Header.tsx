'use client'

import Link from 'next/link'
import { WalletConnect } from './WalletConnect'

export const Header = () => {
  return (
    <nav className="minimal-nav">
      <Link href="/" className="brand">
        VIDEODANZA
      </Link>

      <div className="nav-links">
        <Link href="/">Inicio</Link>
        <Link href="/gallery">Galería</Link>
        <Link href="/mint" className="featured">
          Crear NFT
        </Link>
      </div>

      <div style={{ paddingLeft: '1.5vw', borderLeft: '1px solid #000' }}>
        <WalletConnect />
      </div>
    </nav>
  )
}
