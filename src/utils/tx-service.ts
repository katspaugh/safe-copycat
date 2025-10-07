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
}

const CONFIG_SERVICE = 'https://safe-config.safe.global/api/v1/chains/'

export const getChainConfigs = async () => {
  return fetch(CONFIG_SERVICE).then(resp => resp.json())
}

export const getCreationInfo = async (txServiceHost: string, safeAddress: string): Promise<CreationInfo> => {
  const url = `${txServiceHost}/api/v1/safes/${safeAddress}/creation/`
  return fetch(url).then(resp => resp.json())
}
