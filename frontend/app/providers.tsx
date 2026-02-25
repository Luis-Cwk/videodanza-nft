'use client'

import type { ReactNode } from 'react'
import { WagmiProvider } from 'wagmi'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { config } from '@/lib/web3-config'
import { Header } from '@/components/common/Header'
import '@rainbow-me/rainbowkit/styles.css'

const queryClient = new QueryClient()

export function RootProvider({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={config}>
        <RainbowKitProvider>
          <Header />
          {children}
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  )
}
