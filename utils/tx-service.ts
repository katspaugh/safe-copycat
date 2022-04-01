const txServiceHosts: Record<string, string> = {
  '1': 'safe-transaction.gnosis.io',
  '4': 'safe-transaction.rinkeby.gnosis.io',
  '100': 'safe-transaction.xdai.gnosis.io',
  '137': 'safe-transaction.polygon.gnosis.io',
  '246': 'safe-transaction.ewc.gnosis.io',
  '42161': 'safe-transaction.arbitrum.gnosis.io',
};

export type CreationInfo = {
  created: string;
  creator: string;
  dataDecoded: {
    method: 'setup';
    parameters: unknown;
  };
  factoryAddress: string;
  masterCopy: string;
  setupData: string;
  transactionHash: string;
}

export const getCreationInfo = (chainId: string, safeAddress: string): Promise<CreationInfo> => {
  const url = `https://${txServiceHosts[chainId]}/api/v1/safes/${safeAddress}/creation/`

  return fetch(url).then(resp => {
    if (!resp.ok) {
      throw new Error(resp.statusText)
    }
    return resp.json()
  })
}
