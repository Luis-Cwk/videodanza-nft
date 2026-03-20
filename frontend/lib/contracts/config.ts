export const CONTRACT_ADDRESS = '0x4986712a18eEc3559C29fC421Ad6D4BE38Faf763' as const
export const CHAIN_ID = 11155111 as const // Sepolia Ethereum
export const MINT_PRICE = '0.001' // ETH
export const ROYALTY_PERCENTAGE = 7.5

export const SEPOLIA_CHAIN_CONFIG = {
  id: CHAIN_ID,
  name: 'Ethereum Sepolia',
  network: 'sepolia',
  nativeCurrency: {
    decimals: 18,
    name: 'Sepolia Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://ethereum-sepolia.publicnode.com'] },
    public: { http: ['https://ethereum-sepolia.publicnode.com'] },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
}
