import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import proxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.3.0/proxy_factory.json'
import { getCreationInfo, CreationInfo } from '../../utils/tx-service'
import { copySafe } from '../../utils/eth'
import TextCopy from '../TextCopy'
import AddressInput from '../AddressInput'
import styles from './styles.module.css'

const ShortNames: Record<string, string> = {
  '1': 'eth',
  '4': 'rin',
  '100': 'gno',
  '137': 'matic',
  '42161': 'arb1',
}
const Chains: Record<string, string> = {
  '1': 'Mainnet',
  '4': 'Rinkeby',
  '100': 'Gnosis',
  '137': 'Polygon',
  '42161': 'Arbitrum',
}

const getSafeUrl = (chainId: string, safeAddress: string): string => {
  return `https://gnosis-safe.io/app/${ShortNames[chainId]}:${safeAddress}`
}

interface CopycatProps {
  safe?: {
    safeAddress: string
    chainId: number
  }
}

const Copycat = ({ safe }: CopycatProps): React.ReactElement => {
  const [safeAddress, setSafeAddress] = useState<string>(safe?.safeAddress)
  const [chainId, setChainId] = useState<string>(safe ? safe.chainId.toString() : undefined)
  const [creation, setCreation] = useState<CreationInfo|null>(null)
  const [successHash, setSuccessHash] = useState<string>()
  const [newSafeUrl, setNewSafeUrl] = useState<string>('')
  const [error, setError] = useState<Error>()
  const chainSelect = useRef<HTMLSelectElement>()
  const factoryAddresses: Record<string, string> = proxyFactories.networkAddresses
  const isSupported = creation ? creation.factoryAddress === factoryAddresses[chainId] : true

  // Allow bare Ethereum addresses and EIP-1337 addresses with a prefix
  const onSafeAddressInput = (address: string, origChainId: string) => {
    setSafeAddress(address)
    setChainId(origChainId)
  }

  const onChainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setChainId(e.target.value)
  }

  // When the user submits the form, we create a copy of the Safe
  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Reset previous request
    setSuccessHash(undefined)
    setError(undefined)

    // Make sure we have a creation tx and a new chainId
    const newChainId = chainSelect.current.value;
    if (!creation || !factoryAddresses[newChainId]) return

    setNewSafeUrl(getSafeUrl(newChainId, safeAddress))

    // Create a copy of the Safe
    try {
      const hash = await copySafe(chainId, newChainId, creation.transactionHash)
      setSuccessHash(hash)
    } catch (err) {
      console.error(err)
      setError(err)
    }
  }

  // Request the Safe creation tx from the Transaction Service
  useEffect(() => {
    setCreation(null)

    if (chainId && safeAddress) {
      setError(undefined)
      setSuccessHash(undefined)

      getCreationInfo(chainId, safeAddress)
        .then(setCreation)
        .catch((err) => {
          console.error(err)
          setError(new Error('Failed to load creation transaction'))
        })
    }
  }, [chainId, safeAddress])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Image src="/logo.svg" alt="Safe Copycat" height="100" width="100" /> 

        <div>
          <h1>
            Safe Copycat
          </h1>

          <h3>
            Deploy a Safe to the same address on another chain
          </h3>
        </div>
      </div>

      {!isSupported && (
        <div className={styles.warning}>
          <b>Unsupported factory address!</b><br />
          Copying the Safe to another network will most likely not work.<br />
          The official proxy factory address is {factoryAddresses[chainId]}
        </div>
      )}

      <div>
        <b>Safe address:</b>
        <AddressInput onChange={onSafeAddressInput} defaultValue={safeAddress} />
        {safeAddress == null || chainId == null ? '' : creation ? '✅' : '❌'}
      </div>

      <div>
        <label>
          <b>Chain:</b>
          <select value={chainId || ''} onChange={onChainChange}>
            <option value="">Select a chain</option>
            {Object.keys(Chains).map((key) => (
              <option key={key} value={key}>{Chains[key]}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <b>Created</b> on {creation ? new Date(creation.created).toLocaleDateString() : null}
        {' '}by<TextCopy text={creation?.creator} />
      </div>

      <div>
        <b>Factory:</b>
        <TextCopy text={creation?.factoryAddress} />
        {' '}{creation ? isSupported ? '✅' : '❌' : ''}
      </div>

      <div>
        <form action="#" method="post" onSubmit={onSubmit}>
          <label>
            <b>Select new chain:</b>
            <select ref={chainSelect}>
              {Object.keys(Chains).map((key) => (
                <option key={key} value={key} disabled={key === chainId}>{Chains[key]}</option>
              ))}
            </select>
          </label>

          <button type="submit" disabled={!creation || !isSupported}>Copy Safe</button>
        </form>
      </div>

      {successHash && (
        <>
          <div>
            <b>Transaction hash:</b> {successHash}
          </div>

          <div>
            <a href={newSafeUrl} target="_blank" rel="noreferrer">
              Go to the new Safe
            </a>
          </div>
        </>
      )}

      {error && (
        <div className={styles.error}>
          {error.message}
        </div>
      )}
    </div>
  )
}

export default Copycat
