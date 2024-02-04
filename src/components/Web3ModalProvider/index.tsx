'use client'

import type { ReactNode } from 'react'
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = '62f7e0ef7338bf4c489935cbbf6c38d6'

// 2. Set chains
const chains = [
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io/address/{{address}}',
    rpcUrl: 'https://cloudflare-eth.com',
  },
  {
    chainId: 100,
    name: 'Gnosis Chain',
    currency: 'XDAI',
    explorerUrl: 'https://gnosisscan.io/address/{{address}}',
    rpcUrl: 'https://rpc.gnosis.gateway.fm',
  },
  {
    chainId: 137,
    name: 'Polygon',
    currency: 'MATIC',
    explorerUrl: 'https://polygonscan.com/address/{{address}}',
    rpcUrl: 'https://polygon-rpc.com',
  },
  {
    chainId: 1101,
    name: 'Polygon zkEVM',
    currency: 'ETH',
    explorerUrl: 'https://zkevm.polygonscan.com/address/{{address}}',
    rpcUrl: 'https://zkevm-rpc.com',
  },
  {
    chainId: 56,
    name: 'BNB Chain',
    currency: 'BNB',
    explorerUrl: 'https://bscscan.com/address/{{address}}',
    rpcUrl: 'https://bsc-dataseed.binance.org/',
  },
  {
    chainId: 42161,
    name: 'Arbitrum',
    currency: 'AETH',
    explorerUrl: 'https://arbiscan.io/address/{{address}}',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
  },
  {
    chainId: 10,
    name: 'Optimism',
    currency: 'OETH',
    explorerUrl: 'https://optimistic.etherscan.io/address/{{address}}',
    rpcUrl: 'https://mainnet.optimism.io/',
  },
  {
    chainId: 8453,
    name: 'Base',
    currency: 'ETH',
    explorerUrl: 'https://basescan.org/address/{{address}}',
    rpcUrl: 'https://developer-access-mainnet.base.org',
  },
  {
    chainId: 324,
    name: 'zkSync Era',
    currency: 'ETH',
    explorerUrl: 'https://explorer.zksync.io/address/{{address}}',
    rpcUrl: 'https://mainnet.era.zksync.io',
  },
  {
    chainId: 42220,
    name: 'Celo',
    currency: 'CELO',
    explorerUrl: 'https://explorer.celo.org/mainnet/address/{{address}}',
    rpcUrl: 'https://rpc.ankr.com/celo',
  },
  {
    chainId: 43114,
    name: 'Avalanche',
    currency: 'AVAX',
    explorerUrl: 'https://snowtrace.io/address/{{address}}',
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
  },
  {
    chainId: 1313161554,
    name: 'Aurora',
    currency: 'ETH',
    explorerUrl: 'https://aurorascan.dev/address/{{address}}/transactions',
    rpcUrl: 'https://mainnet.aurora.dev',
  },
  {
    chainId: 11155111,
    name: 'Sepolia',
    currency: 'ETH',
    explorerUrl: 'https://sepolia.etherscan.io/address/{{address}}',
    rpcUrl: 'https://rpc.sepolia.org',
  },
  {
    chainId: 84531,
    name: 'Base Goerli',
    currency: 'bGOR',
    explorerUrl: 'https://goerli.basescan.org/address/{{address}}',
    rpcUrl: 'https://goerli.base.org',
  },
]

// 3. Create modal
const metadata = {
  name: 'Safe Copycat',
  description: 'Copy a Safe to another chain',
  url: 'https://safe-copycat.pages.dev', // origin must match your domain & subdomain
  icons: ['https://safe-copycat.pages.dev/logo.svg'],
}

createWeb3Modal({
  ethersConfig: defaultConfig({ metadata }),
  chains,
  projectId,
  enableAnalytics: false, // Optional - defaults to your Cloud configuration
})

function Web3ModalProvider({ children }: { children: ReactNode }) {
  return children
}

export default Web3ModalProvider
