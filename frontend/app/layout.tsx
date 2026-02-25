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
      <body suppressHydrationWarning>
        <RootProvider>
          <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {children}
          </main>
        </RootProvider>
      </body>
    </html>
  )
}
