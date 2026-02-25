export const CONTRACT_ADDRESS = '0xA4bFA5843B6134a55310D1346b31BD7Bd29CfFEf' as const
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
    default: { http: ['https://eth-sepolia.g.alchemy.com/v2/demo'] },
    public: { http: ['https://eth-sepolia.g.alchemy.com/v2/demo'] },
  },
  blockExplorers: {
    default: {
      name: 'Etherscan',
      url: 'https://sepolia.etherscan.io',
    },
  },
  testnet: true,
}
