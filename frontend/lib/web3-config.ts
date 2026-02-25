import '@rainbow-me/rainbowkit/styles.css'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { sepolia } from 'viem/chains'

export const config = getDefaultConfig({
  appName: 'VideoDanza NFT',
  projectId: 'VIDEODANZA_PROJECT', // Update with your actual WalletConnect project ID
  chains: [sepolia],
  ssr: true,
})
