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
  originalTxInput: string
): Promise<string> => {
  const provider = new BrowserProvider(walletProvider)
  const signer = await provider.getSigner()

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
