import { sepolia } from 'viem/chains'
import { CONTRACT_ADDRESS, CHAIN_ID } from './config'
import VideoDanzaNFTABI from './VideoDanzaNFT.abi.json'

export { VideoDanzaNFTABI }
export { CONTRACT_ADDRESS, CHAIN_ID }

export const contractConfig = {
  address: CONTRACT_ADDRESS,
  abi: VideoDanzaNFTABI,
} as const

export { sepolia }
