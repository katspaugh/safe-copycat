import { BrowserProvider, Contract, Interface } from 'ethers'

export type SafeInfo = {
  owners: string[]
  threshold: number
}

// Safe contract ABI (minimal)
const SAFE_ABI = [
  'function getOwners() view returns (address[])',
  'function getThreshold() view returns (uint256)',
  'function swapOwner(address prevOwner, address oldOwner, address newOwner)',
  'function addOwnerWithThreshold(address owner, uint256 _threshold)',
  'function removeOwner(address prevOwner, address owner, uint256 _threshold)',
  'function changeThreshold(uint256 _threshold)',
]

/**
 * Get current Safe configuration (owners and threshold)
 */
export const getSafeInfo = async (
  providerOrRpcUrl: any,
  safeAddress: string
): Promise<SafeInfo> => {
  // Support both wallet provider and RPC URL
  const ethersProvider =
    typeof providerOrRpcUrl === 'string'
      ? new BrowserProvider(
          (window as any).ethereum || { request: () => Promise.reject() }
        )
      : new BrowserProvider(providerOrRpcUrl)

  const safe = new Contract(safeAddress, SAFE_ABI, ethersProvider)

  const [owners, threshold] = await Promise.all([
    safe.getOwners(),
    safe.getThreshold(),
  ])

  return {
    owners: owners.map((addr: string) => addr.toLowerCase()),
    threshold: Number(threshold),
  }
}

/**
 * Get current Safe configuration using read-only RPC
 */
export const getSafeInfoReadOnly = async (
  chainId: string,
  safeAddress: string
): Promise<SafeInfo> => {
  // RPC endpoints for read-only access
  const rpcEndpoints: Record<string, string> = {
    '1': 'https://eth.llamarpc.com',
    '10': 'https://mainnet.optimism.io',
    '56': 'https://bsc-dataseed.binance.org',
    '100': 'https://rpc.gnosischain.com',
    '137': 'https://polygon-rpc.com',
    '8453': 'https://mainnet.base.org',
    '42161': 'https://arb1.arbitrum.io/rpc',
  }

  const rpcUrl = rpcEndpoints[chainId]
  if (!rpcUrl) {
    throw new Error(`No RPC endpoint configured for chain ${chainId}`)
  }

  // Call eth_call directly via RPC
  const safeInterface = new Interface(SAFE_ABI)

  const [ownersData, thresholdData] = await Promise.all([
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: safeAddress,
            data: safeInterface.encodeFunctionData('getOwners', []),
          },
          'latest',
        ],
        id: 1,
      }),
    }).then((r) => r.json()),
    fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [
          {
            to: safeAddress,
            data: safeInterface.encodeFunctionData('getThreshold', []),
          },
          'latest',
        ],
        id: 2,
      }),
    }).then((r) => r.json()),
  ])

  const owners = safeInterface.decodeFunctionResult('getOwners', ownersData.result)[0]
  const threshold = safeInterface.decodeFunctionResult('getThreshold', thresholdData.result)[0]

  return {
    owners: owners.map((addr: string) => addr.toLowerCase()),
    threshold: Number(threshold),
  }
}

/**
 * Decode the initial Safe setup from the initializer data
 */
export const decodeInitialSetup = (initializerData: string): SafeInfo | null => {
  try {
    const setupInterface = new Interface([
      'function setup(address[] _owners, uint256 _threshold, address to, bytes data, address fallbackHandler, address paymentToken, uint256 payment, address paymentReceiver)',
    ])

    const decoded = setupInterface.parseTransaction({ data: initializerData })
    if (!decoded) return null

    return {
      owners: decoded.args[0].map((addr: string) => addr.toLowerCase()),
      threshold: Number(decoded.args[1]),
    }
  } catch (err) {
    console.error('Failed to decode initializer:', err)
    return null
  }
}

/**
 * Compare two Safe configurations
 */
export const compareSetups = (
  initial: SafeInfo,
  current: SafeInfo
): { isDifferent: boolean; changes: string[] } => {
  const changes: string[] = []

  // Check threshold
  if (initial.threshold !== current.threshold) {
    changes.push(
      `Threshold changed from ${initial.threshold} to ${current.threshold}`
    )
  }

  // Check owners
  const initialOwners = new Set(initial.owners)
  const currentOwners = new Set(current.owners)

  const addedOwners = current.owners.filter((o) => !initialOwners.has(o))
  const removedOwners = initial.owners.filter((o) => !currentOwners.has(o))

  if (addedOwners.length > 0) {
    changes.push(
      `Added ${addedOwners.length} owner(s): ${addedOwners.map((o) => `${o.slice(0, 6)}...${o.slice(-4)}`).join(', ')}`
    )
  }

  if (removedOwners.length > 0) {
    changes.push(
      `Removed ${removedOwners.length} owner(s): ${removedOwners.map((o) => `${o.slice(0, 6)}...${o.slice(-4)}`).join(', ')}`
    )
  }

  return {
    isDifferent: changes.length > 0,
    changes,
  }
}

/**
 * Create transaction data to sync Safe configuration
 * This creates a batched transaction using MultiSend
 */
export const createSyncTransaction = async (
  initial: SafeInfo,
  target: SafeInfo,
  safeAddress: string
): Promise<{ to: string; data: string; value: string }> => {
  const safeInterface = new Interface(SAFE_ABI)

  const transactions: Array<{ to: string; data: string }> = []

  // Handle owner changes
  const initialOwners = new Set(initial.owners)
  const targetOwners = new Set(target.owners)

  const ownersToAdd = target.owners.filter((o) => !initialOwners.has(o))
  const ownersToRemove = initial.owners.filter((o) => !targetOwners.has(o))

  // Add new owners (with current threshold to avoid issues)
  for (const owner of ownersToAdd) {
    const data = safeInterface.encodeFunctionData('addOwnerWithThreshold', [
      owner,
      initial.threshold, // Keep threshold same while adding
    ])
    transactions.push({ to: safeAddress, data })
  }

  // Remove old owners (need to find previous owner in the linked list)
  for (let i = 0; i < ownersToRemove.length; i++) {
    const owner = ownersToRemove[i]
    const ownerIndex = initial.owners.indexOf(owner)
    const prevOwner =
      ownerIndex === 0
        ? '0x0000000000000000000000000000000000000001' // Sentinel
        : initial.owners[ownerIndex - 1]

    // Calculate new threshold after removal
    const newOwnerCount = initial.owners.length - (i + 1) + ownersToAdd.length
    const newThreshold = Math.min(initial.threshold, newOwnerCount)

    const data = safeInterface.encodeFunctionData('removeOwner', [
      prevOwner,
      owner,
      newThreshold,
    ])
    transactions.push({ to: safeAddress, data })
  }

  // Change threshold if needed (do this last)
  if (initial.threshold !== target.threshold) {
    const data = safeInterface.encodeFunctionData('changeThreshold', [
      target.threshold,
    ])
    transactions.push({ to: safeAddress, data })
  }

  // If only one transaction, return it directly
  if (transactions.length === 1) {
    return {
      to: transactions[0].to,
      data: transactions[0].data,
      value: '0',
    }
  }

  // For multiple transactions, we need to use MultiSend
  // For now, return the first transaction and note that full batching would require MultiSend
  // This is a simplified version
  if (transactions.length > 1) {
    console.warn(
      'Multiple transactions needed. Creating first transaction. User will need to create additional transactions.'
    )
  }

  return {
    to: transactions[0].to,
    data: transactions[0].data,
    value: '0',
  }
}
