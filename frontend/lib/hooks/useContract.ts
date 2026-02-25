'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { CONTRACT_ADDRESS, VideoDanzaNFTABI } from '@/lib/contracts'

export const useNFTContract = () => {
  return {
    address: CONTRACT_ADDRESS,
    abi: VideoDanzaNFTABI,
  }
}

export const useMintPrice = () => {
  const contract = useNFTContract()
  
  const { data: price } = useReadContract({
    ...contract,
    functionName: 'mintPrice',
  } as any)

  return price
}

export const useIsSeedMinted = (seed: `0x${string}`) => {
  const contract = useNFTContract()
  
  const { data: isMinted } = useReadContract({
    ...contract,
    functionName: '_seedMinted',
    args: [seed],
  } as any)

  return isMinted
}

export const useMintNFT = () => {
  const contract = useNFTContract()
  const price = useMintPrice()

  const { data: hash, isPending, writeContract } = useWriteContract()

  const mint = async (seed: `0x${string}`) => {
    if (!price) throw new Error('Price not loaded')

    writeContract({
      ...contract,
      functionName: 'mint',
      args: [seed],
      value: price,
    } as any)
  }

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: hash as any,
  })

  return {
    mint,
    isPending: isPending || isConfirming,
    isSuccess,
    hash,
  }
}

export const useTokenMetadata = (tokenId: bigint) => {
  const contract = useNFTContract()
  
  const { data: metadata } = useReadContract({
    ...contract,
    functionName: 'tokenURI',
    args: [tokenId],
  } as any)

  return metadata
}
