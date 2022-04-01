import React, { useState, useEffect, useRef } from 'react'
import proxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.3.0/proxy_factory.json'
import legacyProxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.1.1/proxy_factory.json'
import { getCreationInfo, CreationInfo } from '../../utils/tx-service'
import { Chains, ShortNames, connectWallet, copySafe, getConnectedAddress, getTransactionInfo } from '../../utils/eth'
import AddressInput from '../AddressInput'
import WalletHeader from '../WalletHeader'
import styles from './styles.module.css'

const getSafeUrl = (chainId: string, safeAddress: string): string => {
  return `https://gnosis-safe.io/app/${ShortNames[chainId]}:${safeAddress}`
}

interface CopycatProps {
  safe?: {
    safeAddress: string
    chainId: number
  }
}

const factoryAddresses: Record<string, string> = proxyFactories.networkAddresses
const legacyAddresses: Record<string, string> = legacyProxyFactories.networkAddresses
const legacyFactoryExceptions = { '100': '' } // legacy xDai factory is incomaptible with others

const Copycat = ({ safe }: CopycatProps): React.ReactElement => {
  const [safeAddress, setSafeAddress] = useState<string>(safe?.safeAddress)
  const [chainId, setChainId] = useState<string>(safe ? safe.chainId.toString() : undefined)
  const [walletAddress, setWalletAddress] = useState<string>('')
  const [creation, setCreation] = useState<CreationInfo|null>(null)
  const [newSafeUrl, setNewSafeUrl] = useState<string>('')
  const [message, setMessage] = useState<string|Error>('')
  const chainSelect = useRef<HTMLSelectElement>()

  // If the Safe was created with a legacy 1.1.1 factory, use that for the new Safe
  let supportedFactoryAddress = {}
  let version = ''
  if (creation) {
    if (creation.factoryAddress === factoryAddresses[chainId]) {
      version = 'v1.3.0'
      supportedFactoryAddress = factoryAddresses
    } else if (creation.factoryAddress === legacyAddresses[chainId]) {
      version = 'v1.1.1'
      supportedFactoryAddress = { ...legacyAddresses, ...legacyFactoryExceptions }
    }
  }

  const isSupported = creation ? !!version : true
  const isOwner = !creation || !walletAddress ? true : creation.creator.toLowerCase() === walletAddress.toLowerCase()

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
    setMessage('')

    // Make sure we have a creation tx and a new chainId
    const newChainId = chainSelect.current.value;
    if (!creation || !isSupported) return

    // Get transaction info
    let txInfo = undefined
    try {
      txInfo = await getTransactionInfo(chainId, creation.transactionHash)
    } catch (err) {
      setMessage(new Error(err.message))
      return
    }

    setMessage(`Switching to ${Chains[newChainId]} and creating a copy of the Safe`)

    // Create a copy of the Safe
    let hash = ''
    try {
      hash = await copySafe(newChainId, txInfo)
    } catch (err) {
      setMessage(new Error(err.message))
    }

    if (hash) {
      setMessage(`Transaction created: ${hash}`)
      setNewSafeUrl(getSafeUrl(newChainId, safeAddress))
    }
  }

  const onWalletConnect = async (): Promise<string> => {
    setMessage('')
    try {
      const wallet = await connectWallet()
      setWalletAddress(wallet.selectedAddress)
    } catch (err) {
      setMessage(new Error(err.message))
    }
    return ''
  }

  // Detect connected wallet
  useEffect(() => {
    getConnectedAddress().then(setWalletAddress)
  }, [])

  // Request the Safe creation tx from the Transaction Service
  useEffect(() => {
    setCreation(null)

    if (chainId && safeAddress) {
      setMessage('')

      setMessage('Getting creation transaction...')

      getCreationInfo(chainId, safeAddress)
        .then((data) => {
          setCreation(data)
          setMessage('')
        })
        .catch((err) => {
          console.error(err)
          setMessage(new Error('Failed to load creation transaction'))
        })
    }
  }, [chainId, safeAddress])

  useEffect(() => {
    if (message instanceof Error) {
      console.error(message)
    }
  }, [message])

  return (
    <div className={styles.container}>
      {safe ? null : <WalletHeader onConnect={onWalletConnect} walletAddress={walletAddress} />}

      <div className={styles.header}>
        <img src="/logo.svg" alt="Safe Copycat" height="100" width="100" />

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
          <strong>Unsupported factory address!</strong><br />
          Copying the Safe to another network will not work.<br />
          The official proxy factory address is {factoryAddresses[chainId] || legacyAddresses[chainId]}
        </div>
      )}

      {!isOwner && (
        <div className={styles.warning}>
          <strong>You&apos;re not the creator of that Safe!</strong><br />
          Copying the Safe to another network will not work.<br />
        </div>
      )}

      <div>
        <b>Safe address:</b>
        <AddressInput onChange={onSafeAddressInput} defaultValue={safeAddress}>
          {safeAddress == null || chainId == null ? '' : creation ? '✅' : '❌'}
        </AddressInput>
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
        <b>Created on:</b>
        {creation ? new Date(creation.created).toLocaleDateString() : '...'}
      </div>

      <div>
        <b>Creator:</b>
        {creation ? creation?.creator : '...'}
      </div>

      <div>
        <b>Factory:</b>
        {creation?.factoryAddress || '...'}{' '}
        <strong>{version} </strong>
        {creation ? isSupported ? '✅' : '❌' : ''}
      </div>

      <div>
        <form action="#" method="post" onSubmit={onSubmit}>
          <label>
            <b>Select new chain:</b>
            <select ref={chainSelect} required>
              {Object.keys(Chains).map((key) => (
                <option key={key} value={key} disabled={key === chainId || !supportedFactoryAddress[key]}>
                  {Chains[key]}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.submit}>
            <button type="submit" disabled={!creation || !isSupported}>Copy Safe</button>
          </div>
        </form>
      </div>

      {newSafeUrl && (
        <div className={styles.result}>
          <a href={newSafeUrl} target="_blank" rel="noreferrer">
            Go to the new Safe
          </a>
        </div>
      )}

      {message && (
        <div className={message instanceof Error ? styles.error : styles.message}>
          {message.toString()}
        </div>
      )}
    </div>
  )
}

export default Copycat
