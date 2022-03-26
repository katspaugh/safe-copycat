import detectEthereumProvider from '@metamask/detect-provider';

const connectWallet = async (chainId: string) => {
  // Detected wallet
  const provider: any = await detectEthereumProvider();

  if (!provider) {
    throw Error('No wallet detected');
  }

  // Connect to the wallet
  await provider.request({ method: 'eth_requestAccounts' });

  // Make sure we're on the same chain as the Safe
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${Number(chainId).toString(16)}` }]
  });

  return provider
}

export const copySafe = async (oldChainId: string, newChainId: string, txHash: string): Promise<string> => {
  // Detected wallet
  const provider = await connectWallet(oldChainId);

  // Request the Safe creation tx by its hash
  const tx = await provider.request({
    method: 'eth_getTransactionByHash',
    params: [ txHash ]
  });

  console.log('Creation tx', tx);

  // Switch to the chain where we're creating a new Safe
  await provider.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: `0x${Number(newChainId).toString(16)}` }]
  });

  // Create a new Safe with the same data as the original Safe creation tx
  const params = {
    from: tx.from,
    to: tx.to,
    data: tx.input,
    value: tx.value
  };
  console.log('Creating new Safe', params);
  const hash = await provider.request({
    method: 'eth_sendTransaction',
    params: [ params ]
  });

  return hash
}