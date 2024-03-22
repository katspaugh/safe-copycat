const CONFIG_SERVICE = 'https://safe-config.safe.global/api/v1/chains/'

async function getJson(url) {
  const resp = await fetch(url)
  if (!resp.ok) {
    throw new Error(`Failed to fetch ${url}: ${resp.statusText}`)
  }
  return resp.json()
}

export async function getChainConfigs() {
  const data = await getJson(CONFIG_SERVICE)
  return data.results
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
  return getJson(url)
}
