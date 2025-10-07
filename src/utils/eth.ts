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
  '56': 'bnb',
  '100': 'gno',
  '137': 'matic',
  '324': 'zksync',
  '1101': 'zkevm',
  '8453': 'base',
  '42161': 'arb1',
  '42220': 'celo',
  '43114': 'avax',
  '84531': 'base-gor',
  '11155111': 'sep',
  '1313161554': 'aurora',
}

export const Chains: Record<string, string> = {
  '1': 'Ethereum',
  '10': 'Optimism',
  '56': 'BNB Chain',
  '100': 'Gnosis Chain',
  '137': 'Polygon',
  '324': 'zkSync Era',
  '1101': 'Polygon zkEVM',
  '8453': 'Base',
  '42161': 'Arbitrum',
  '42220': 'Celo',
  '43114': 'Avalanche',
  '84531': 'Base Goerli',
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
  originalTxInput: string
): Promise<string> => {
  // Switch to the chain where we're creating a new Safe
  await switchNetwork(walletProvider, chainId)

  // Deploy using CREATE2 with the exact same parameters
  const hash = await deploySafeWithCREATE2(walletProvider, factoryAddress, creation, chainId, originalTxInput)

  return hash
}
