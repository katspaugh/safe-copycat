import detectEthereumProvider from '@metamask/detect-provider'

type TransactionInfo = {
  from: string
  to: string
  input: string
  value: string
}

export const ShortNames: Record<string, string> = {
  '1': 'eth',
  '4': 'rin',
  '5': 'gor',
  '100': 'gno',
  '137': 'matic',
  '246': 'ewt',
  '42161': 'arb1',
}

export const Chains: Record<string, string> = {
  '1': 'Mainnet',
  '4': 'Rinkeby',
  '5': 'Görli',
  '100': 'Gnosis',
  '137': 'Polygon',
  '246': 'EWC',
  '42161': 'Arbitrum',
}

const switchNetwork = async (chainId: string) => {
  const provider: any = await detectEthereumProvider()

  const currentChainId = await provider.request({
    method: 'eth_chainId'
  })

  const targetChainId = `0x${Number(chainId).toString(16)}`

  // Already on the right chain
  if (targetChainId === currentChainId) return

  // Metamask-only: switch to the target chain
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }]
    })
  } catch (err) {
    throw new Error(`Please swith the wallet to ${Chains[chainId]}`)
  }
}

export const connectWallet = async () => {
  const provider: any = await detectEthereumProvider()

  if (!provider) {
    throw Error('No wallet detected')
  }

  // Connect to the wallet
  await provider.request({ method: 'eth_requestAccounts' })

  return provider
}

export const getConnectedAddress = async (): Promise<string> => {
  try {
    const provider: any = await detectEthereumProvider()
    return provider.selectedAddress
  } catch (err) {
    return ''
  }
}

const txInfoCache = {}

export const getTransactionInfo = async (chainId: string, txHash: string): Promise<TransactionInfo> => {
  const cacheKey = `${chainId}_${txHash}`
  if (txInfoCache[cacheKey]) return txInfoCache[cacheKey]

  const provider: any = await detectEthereumProvider()

  // Make sure we're on the same chain as the Safe
  await switchNetwork(chainId)

  // Request the Safe creation tx by its hash
  const tx = await provider.request({
    method: 'eth_getTransactionByHash',
    params: [ txHash ]
  })

  console.log('Creation tx', tx)

  // Memoize the result
  txInfoCache[cacheKey] = tx

  return tx
}

export const copySafe = async (chainId: string, tx: TransactionInfo): Promise<string> => {
  const provider: any = await connectWallet()

  // Switch to the chain where we're creating a new Safe
  await switchNetwork(chainId)

  // Create a new Safe with the same data as the original Safe creation tx
  const params = {
    from: tx.from,
    to: tx.to,
    data: tx.input,
    value: tx.value
  }

  console.log('Creating new Safe', params)

  const hash = await provider.request({
    method: 'eth_sendTransaction',
    params: [ params ]
  })

  return hash
}
