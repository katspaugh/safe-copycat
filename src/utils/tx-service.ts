export type CreationInfo = {
  created: string;
  creator: string;
  dataDecoded: {
    method: string;
    parameters: Array<{
      name: string;
      type: string;
      value: any;
    }>;
  };
  factoryAddress: string;
  masterCopy: string;
  setupData: string;
  transactionHash: string;
  factoryMethod?: string;
  factoryParameters?: Array<{
    name: string;
    type: string;
    value: any;
  }>;
}

const CONFIG_SERVICE = 'https://safe-config.safe.global/api/v1/chains/'

export const getChainConfigs = async () => {
  return fetch(CONFIG_SERVICE).then(resp => resp.json())
}

export const getCreationInfo = async (txServiceHost: string, safeAddress: string): Promise<CreationInfo> => {
  const url = `${txServiceHost}/api/v1/safes/${safeAddress}/creation/`
  return fetch(url).then(resp => resp.json())
}

// Decode the factory method from a transaction
export const decodeFactoryMethod = (txInput: string): { method: string; parameters: any[] } | null => {
  if (!txInput || txInput.length < 10) return null

  const methodId = txInput.slice(0, 10)

  // Known method signatures
  const methods: Record<string, { name: string; signature: string }> = {
    '0xd18af54d': { name: 'createProxyWithCallback', signature: 'createProxyWithCallback(address,bytes,uint256,address)' },
    '0x1688f0b9': { name: 'createProxyWithNonce', signature: 'createProxyWithNonce(address,bytes,uint256)' },
    '0x61b69abd': { name: 'createProxy', signature: 'createProxy(address,bytes)' },
  }

  const method = methods[methodId]
  if (!method) return null

  return {
    method: method.name,
    parameters: [] // We'll decode parameters in the deployment function
  }
}
