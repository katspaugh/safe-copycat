export async function getAccount() {
  const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
  return accounts[0] // Returns the first account
}

export async function switchChain(chainId) {
  // Switch to chain
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${Number(chainId).toString(16)}` }],
  })
}

export async function sendTransaction(txParams) {
  const account = await getAccount()
  txParams.from = account

  const txHash = await window.ethereum.request({
    method: 'eth_sendTransaction',
    params: [txParams],
  })

  return txHash
}

export async function getTransactionByHash(txHash) {
  // Request the Safe creation tx by its hash
  const tx = await window.ethereum.request({
    method: 'eth_getTransactionByHash',
    params: [txHash],
  })
  return tx
}
