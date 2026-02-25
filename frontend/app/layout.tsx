import type { ReactNode } from 'react'
import type { Metadata } from 'next'
import '@/globals.css'
import { RootProvider } from './providers'

export const metadata: Metadata = {
  title: 'VideoDanza NFT',
  description: 'Generative Dance Video NFTs on Sepolia Ethereum',
}

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning style={{ margin: 0, padding: 0 }}>
        <RootProvider>
          {children}
        </RootProvider>
      </body>
    </html>
  )
}
