import '@rainbow-me/rainbowkit/styles.css'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'viem/chains'

export const config = getDefaultConfig({
  appName: 'VideoDanza NFT',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || '964c0e86963ff1c5976e9a82cec565b0',
  chains: [sepolia],
  ssr: true,
})
