import { BrowserProvider, Contract, Interface } from 'ethers'
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
  targetChainId: string
): Promise<string> => {
  const provider = new BrowserProvider(walletProvider)
  const signer = await provider.getSigner()

  // Get the factory contract
  const factory = new Contract(factoryAddress, PROXY_FACTORY_ABI, signer)

  // Extract parameters from the creation info
  const method = creation.dataDecoded.method
  const params = creation.dataDecoded.parameters

  console.log('Deployment method:', method)
  console.log('Parameters:', params)

  // Find the required parameters
  const singletonParam = params.find(p => p.name === '_singleton' || p.name === 'singleton')
  const initializerParam = params.find(p => p.name === 'initializer')
  const saltNonceParam = params.find(p => p.name === 'saltNonce')
  const callbackParam = params.find(p => p.name === 'callback')

  if (!singletonParam || !initializerParam || !saltNonceParam) {
    throw new Error('Missing required parameters for Safe deployment')
  }

  const singleton = singletonParam.value
  const initializer = initializerParam.value
  const saltNonce = saltNonceParam.value

  console.log('Deploying Safe with:')
  console.log('  Singleton:', singleton)
  console.log('  Salt Nonce:', saltNonce)
  console.log('  Initializer length:', initializer.length)

  // Call the appropriate method
  let tx
  if (method === 'createProxyWithCallback' && callbackParam) {
    console.log('  Callback:', callbackParam.value)
    tx = await factory.createProxyWithCallback(
      singleton,
      initializer,
      saltNonce,
      callbackParam.value
    )
  } else {
    tx = await factory.createProxyWithNonce(
      singleton,
      initializer,
      saltNonce
    )
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
