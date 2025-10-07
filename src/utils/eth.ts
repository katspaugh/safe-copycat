import { CreationInfo } from './tx-service'
import { deploySafeWithCREATE2 } from './safe-factory'

type TransactionInfo = {
  from: string
  to: string
  input: string
  value: string
}

export const ShortNames: Record<string, string> = {
  '1': 'eth',
  '10': 'oeth',
  '50': 'xdc',
  '56': 'bnb',
  '100': 'gno',
  '130': 'unichain',
  '137': 'matic',
  '143': 'monad',
  '146': 'sonic',
  '196': 'xlayer',
  '204': 'opbnb',
  '232': 'lens',
  '324': 'zksync',
  '480': 'wc',
  '1101': 'zkevm',
  '3338': 'peaq',
  '3637': 'btc',
  '5000': 'mnt',
  '8453': 'base',
  '9745': 'plasma',
  '10200': 'chiado',
  '16661': '0g',
  '42161': 'arb1',
  '42220': 'celo',
  '43111': 'hemi',
  '43114': 'avax',
  '57073': 'ink',
  '59144': 'linea',
  '80069': 'bepolia',
  '80094': 'berachain',
  '81224': 'codex',
  '84532': 'basesep',
  '534352': 'scr',
  '747474': 'katana',
  '11155111': 'sep',
  '1313161554': 'aurora',
}

export const Chains: Record<string, string> = {
  '1': 'Ethereum',
  '10': 'Optimism',
  '50': 'XDC Network',
  '56': 'BNB Chain',
  '100': 'Gnosis Chain',
  '130': 'Unichain',
  '137': 'Polygon',
  '143': 'Monad',
  '146': 'Sonic',
  '196': 'X Layer',
  '204': 'opBNB',
  '232': 'Lens',
  '324': 'zkSync Era',
  '480': 'World Chain',
  '1101': 'Polygon zkEVM',
  '3338': 'peaq',
  '3637': 'Botanix',
  '5000': 'Mantle',
  '8453': 'Base',
  '9745': 'Plasma',
  '10200': 'Gnosis Chiado',
  '16661': '0G',
  '42161': 'Arbitrum',
  '42220': 'Celo',
  '43111': 'Hemi',
  '43114': 'Avalanche',
  '57073': 'Ink',
  '59144': 'Linea',
  '80069': 'Bepolia',
  '80094': 'Berachain',
  '81224': 'Codex',
  '84532': 'Base Sepolia',
  '534352': 'Scroll',
  '747474': 'Katana',
  '11155111': 'Sepolia',
  '1313161554': 'Aurora',
}

const switchNetwork = async (walletProvider: any, chainId: string) => {
  const currentChainId = await walletProvider.request({
    method: 'eth_chainId',
  })

  const targetChainId = `0x${Number(chainId).toString(16)}`

  // Already on the right chain
  if (targetChainId === currentChainId) return

  // Metamask-only: switch to the target chain
  try {
    await walletProvider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    })
  } catch (err) {
    throw new Error(`Please swith the wallet to ${Chains[chainId]}`)
  }
}

export const getTransactionInfo = async (
  walletProvider: any,
  chainId: string,
  txHash: string,
): Promise<TransactionInfo> => {
  // Make sure we're on the same chain as the Safe
  await switchNetwork(walletProvider, chainId)
  // Request the Safe creation tx by its hash
  const tx = await walletProvider.request({
    method: 'eth_getTransactionByHash',
    params: [txHash],
  })
  console.log('Creation tx', tx)
  return tx
}

// Fetch transaction info without requiring wallet or switching networks (for display only)
export const getTransactionInfoReadOnly = async (
  chainId: string,
  txHash: string,
): Promise<TransactionInfo> => {
  // Use a public RPC endpoint to fetch the transaction
  const rpcUrls: Record<string, string> = {
    '1': 'https://eth.llamarpc.com',
    '10': 'https://optimism.llamarpc.com',
    '137': 'https://polygon.llamarpc.com',
    '42161': 'https://arbitrum.llamarpc.com',
    '8453': 'https://base.llamarpc.com',
    '100': 'https://rpc.gnosischain.com',
  }

  const rpcUrl = rpcUrls[chainId]
  if (!rpcUrl) {
    throw new Error(`No public RPC available for chain ${chainId}`)
  }

  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [txHash],
      id: 1,
    }),
  })

  const data = await response.json()
  if (data.error) {
    throw new Error(data.error.message)
  }

  console.log('Creation tx (read-only)', data.result)
  return data.result
}

export const copySafe = async (walletProvider: any, chainId: string, tx: TransactionInfo): Promise<string> => {
  // Switch to the chain where we're creating a new Safe
  await switchNetwork(walletProvider, chainId)

  // Create a new Safe with the same data as the original Safe creation tx
  const params = {
    from: tx.from,
    to: tx.to,
    data: tx.input,
    value: tx.value,
  }

  console.log('Creating new Safe', params)

  const hash = await walletProvider.request({
    method: 'eth_sendTransaction',
    params: [params],
  })

  return hash
}

export const copySafeWithCREATE2 = async (
  walletProvider: any,
  chainId: string,
  factoryAddress: string,
  creation: CreationInfo,
  originalTxInput: string,
  expectedSafeAddress: string
): Promise<string> => {
  // Switch to the chain where we're creating a new Safe
  await switchNetwork(walletProvider, chainId)

  // Deploy using CREATE2 with the exact same parameters
  const hash = await deploySafeWithCREATE2(walletProvider, factoryAddress, creation, chainId, originalTxInput, expectedSafeAddress)

  return hash
}
