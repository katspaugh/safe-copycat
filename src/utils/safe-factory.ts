import { BrowserProvider, Contract, Interface, AbiCoder } from 'ethers'
import { CreationInfo } from './tx-service'
import { checkCallbackOnChains } from './callback-helper'

// GnosisSafeProxyFactory ABI for v1.3.0
const PROXY_FACTORY_ABI = [
  'function createProxyWithNonce(address _singleton, bytes memory initializer, uint256 saltNonce) public returns (address proxy)',
  'function createProxyWithCallback(address _singleton, bytes memory initializer, uint256 saltNonce, address callback) public returns (address proxy)',
]

export const deploySafeWithCREATE2 = async (
  walletProvider: any,
  factoryAddress: string,
  creation: CreationInfo,
  targetChainId: string,
  originalTxInput: string,
  expectedSafeAddress: string
): Promise<string> => {
  const provider = new BrowserProvider(walletProvider)
  const signer = await provider.getSigner()

  // Check if Safe already exists at the target address
  const code = await provider.getCode(expectedSafeAddress)
  if (code !== '0x') {
    throw new Error(`✅ Safe already exists at ${expectedSafeAddress} on this chain! No need to deploy.`)
  }

  // Get the factory contract
  const factory = new Contract(factoryAddress, PROXY_FACTORY_ABI, signer)
  const factoryInterface = new Interface(PROXY_FACTORY_ABI)

  // Decode the original transaction input
  const decodedData = factoryInterface.parseTransaction({ data: originalTxInput })

  if (!decodedData) {
    throw new Error('Failed to decode transaction data')
  }

  // Verify required contracts exist
  const method = creation.factoryMethod || decodedData.name
  let useCallbackFallback = false

  if (method === 'createProxyWithCallback') {
    const callback = decodedData.args[3]

    if (callback && callback !== '0x0000000000000000000000000000000000000000') {
      const callbackCode = await provider.getCode(callback)
      if (callbackCode === '0x') {
        // Check which chains have this callback
        console.log('Checking callback availability on other chains...')
        const chainIds = ['1', '10', '56', '100', '137', '8453', '42161', '42220', '43114']
        const availability = await checkCallbackOnChains(callback, chainIds)

        const availableChains = Object.entries(availability)
          .filter(([_, exists]) => exists)
          .map(([chainId]) => {
            const chainNames: Record<string, string> = {
              '1': 'Ethereum',
              '10': 'Optimism',
              '56': 'BNB Chain',
              '100': 'Gnosis Chain',
              '137': 'Polygon',
              '8453': 'Base',
              '42161': 'Arbitrum',
              '42220': 'Celo',
              '43114': 'Avalanche',
            }
            return chainNames[chainId]
          })

        const availableMsg = availableChains.length > 0
          ? `\n\n✅ This callback exists on: ${availableChains.join(', ')}\nTry deploying to one of these chains instead!`
          : '\n\n❌ This callback was not found on any major chain.'

        throw new Error(`⚠️ Callback contract ${callback} does not exist on this chain.\n\nThis Safe was deployed with a custom callback that's not available here. The deployment will fail.\n\n⚠️ IMPORTANT: This Safe uses CREATE2 with a callback parameter. The callback address is part of the salt calculation, so:\n• You CANNOT get the same Safe address on a chain without this callback\n• The callback must exist on the target chain for deterministic deployment\n• Deploying without the callback will result in a DIFFERENT address${availableMsg}`)
      }
    }
  }

  // Check if singleton contract exists
  const singleton = decodedData.args[0]
  const singletonCode = await provider.getCode(singleton)
  if (singletonCode === '0x') {
    throw new Error(`⚠️ Singleton contract ${singleton} does not exist on this chain.\n\nThis Safe uses a singleton (master copy) that's not deployed on the target chain. The deployment will fail.\n\nSuggested solutions:\n1. Try a different target chain where this singleton is deployed\n2. This may be an older or custom Safe version`)
  }

  console.log('Decoded factory method:', decodedData.name)
  console.log('Decoded arguments:', decodedData.args)

  // Call the appropriate method with the exact same parameters
  let tx
  try {
    if (method === 'createProxyWithCallback') {
      const [singleton, initializer, saltNonce, callback] = decodedData.args
      console.log('Deploying Safe with createProxyWithCallback:')
      console.log('  Singleton:', singleton)
      console.log('  Salt Nonce:', saltNonce.toString())
      console.log('  Callback:', callback)
      console.log('  Initializer length:', initializer.length)

      tx = await factory.createProxyWithCallback(
        singleton,
        initializer,
        saltNonce,
        callback
      )
    } else if (method === 'createProxyWithNonce') {
      const [singleton, initializer, saltNonce] = decodedData.args
      console.log('Deploying Safe with createProxyWithNonce:')
      console.log('  Singleton:', singleton)
      console.log('  Salt Nonce:', saltNonce.toString())
      console.log('  Initializer length:', initializer.length)

      tx = await factory.createProxyWithNonce(
        singleton,
        initializer,
        saltNonce
      )
    } else {
      throw new Error(`Unsupported deployment method: ${method}`)
    }
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.code === 'CALL_EXCEPTION') {
      throw new Error('Transaction would fail. Possible reasons:\n- Safe already deployed at this address\n- Callback contract not available on this chain\n- Singleton contract not available on this chain')
    }
    throw error
  }

  console.log('Transaction sent:', tx.hash)

  // Wait for confirmation
  const receipt = await tx.wait()
  console.log('Transaction confirmed:', receipt)

  return tx.hash
}

// Helper to predict the Safe address using CREATE2
export const predictSafeAddress = (
  factoryAddress: string,
  singleton: string,
  initializer: string,
  saltNonce: string
): string => {
  // This would require keccak256 hashing, but for now we'll rely on the transaction
  // The actual formula is: keccak256(0xff ++ factory ++ salt ++ keccak256(deploymentData))
  throw new Error('Address prediction not yet implemented')
}
