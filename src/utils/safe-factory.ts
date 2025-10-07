import { BrowserProvider, Contract, Interface, AbiCoder } from 'ethers'
import { CreationInfo } from './tx-service'

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

  // Verify required contracts exist
  const method = creation.factoryMethod || decodedData?.name
  if (method === 'createProxyWithCallback') {
    const tempInterface = new Interface(PROXY_FACTORY_ABI)
    const tempDecoded = tempInterface.parseTransaction({ data: originalTxInput })
    const callback = tempDecoded?.args[3]

    if (callback && callback !== '0x0000000000000000000000000000000000000000') {
      const callbackCode = await provider.getCode(callback)
      if (callbackCode === '0x') {
        throw new Error(`⚠️ Callback contract ${callback} does not exist on this chain.\n\nThis Safe was deployed with a custom callback that's not available here. The deployment will fail.\n\nSuggested solutions:\n1. Try a different target chain where the callback exists\n2. Contact the Safe creator about callback availability`)
      }
    }
  }

  // Get the factory contract
  const factory = new Contract(factoryAddress, PROXY_FACTORY_ABI, signer)
  const factoryInterface = new Interface(PROXY_FACTORY_ABI)

  // Decode the original transaction input
  const decodedData = factoryInterface.parseTransaction({ data: originalTxInput })

  if (!decodedData) {
    throw new Error('Failed to decode transaction data')
  }

  console.log('Decoded factory method:', decodedData.name)
  console.log('Decoded arguments:', decodedData.args)

  const method = creation.factoryMethod || decodedData.name

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
