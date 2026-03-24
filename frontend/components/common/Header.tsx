'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { WalletConnect } from './WalletConnect'

export const Header = () => {
  const pathname = usePathname()

  return (
    <>
      <nav className="fui-nav">
        <Link href="/" className="nav-brand">
          VIDEODANZA
        </Link>

        <div className="nav-links">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>
            [_home]
          </Link>
          <Link href="/gallery" className={pathname === '/gallery' ? 'active' : ''}>
            [_gallery]
          </Link>
          <Link href="/mint" className={pathname === '/mint' ? 'active' : ''}>
            [_mint]
          </Link>
          <Link href="/agent" className={pathname === '/agent' ? 'active' : ''}>
            [_agent]
          </Link>
        </div>

        <div className="nav-wallet">
          <WalletConnect />
        </div>
      </nav>
    </>
  )
}
