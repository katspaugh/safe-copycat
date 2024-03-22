const CONFIG_SERVICE = 'https://safe-config.safe.global/api/v1/chains/'

export async function getChainConfigs() {
  return fetch(CONFIG_SERVICE).then((resp) => resp.json())
}

/**
 * @param {string} txServiceHost
 * @param {string} safeAddress
 * @returns {Promise<{
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
  }>}
 */
/* @returns {Promise<CreationInfo>} */
export async function getCreationInfo(txServiceHost, safeAddress) {
  const url = `${txServiceHost}/api/v1/safes/${safeAddress}/creation/`
  return fetch(url).then((resp) => resp.json())
}
