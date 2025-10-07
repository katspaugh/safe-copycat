import { BrowserProvider } from 'ethers'

/**
 * Check if a callback contract exists on multiple chains
 */
export const checkCallbackOnChains = async (
  callbackAddress: string,
  chainIds: string[]
): Promise<Record<string, boolean>> => {
  const results: Record<string, boolean> = {}

  // Use public RPC endpoints to check each chain
  const rpcEndpoints: Record<string, string> = {
    '1': 'https://eth.llamarpc.com',
    '10': 'https://mainnet.optimism.io',
    '50': 'https://rpc.xdcrpc.com',
    '56': 'https://bsc-dataseed.binance.org',
    '100': 'https://rpc.gnosischain.com',
    '137': 'https://polygon-rpc.com',
    '324': 'https://mainnet.era.zksync.io',
    '1101': 'https://zkevm-rpc.com',
    '5000': 'https://rpc.mantle.xyz',
    '8453': 'https://mainnet.base.org',
    '42161': 'https://arb1.arbitrum.io/rpc',
    '42220': 'https://forno.celo.org',
    '43114': 'https://api.avax.network/ext/bc/C/rpc',
    '59144': 'https://rpc.linea.build',
    '534352': 'https://rpc.scroll.io',
    '1313161554': 'https://mainnet.aurora.dev',
  }

  for (const chainId of chainIds) {
    const rpcUrl = rpcEndpoints[chainId]
    if (!rpcUrl) {
      results[chainId] = false
      continue
    }

    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getCode',
          params: [callbackAddress, 'latest'],
          id: 1,
        }),
      })
      const data = await response.json()
      results[chainId] = data.result && data.result !== '0x'
    } catch (err) {
      console.error(`Failed to check chain ${chainId}:`, err)
      results[chainId] = false
    }
  }

  return results
}
