'use client'

import React, { useState, useEffect } from 'react'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import proxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.3.0/proxy_factory.json'
import legacyProxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.1.1/proxy_factory.json'
import { getCreationInfo, CreationInfo, getChainConfigs } from '../../utils/tx-service'
import { Chains, ShortNames, copySafe, getTransactionInfo } from '../../utils/eth'
import AddressInput from '../AddressInput'
import WalletHeader from '../WalletHeader'
import Web3ModalProvider from '../Web3ModalProvider'
import styles from './styles.module.css'

const getSafeUrl = (chainId: string, safeAddress: string): string => {
  return `https://gnosis-safe.io/app/${ShortNames[chainId]}:${safeAddress}`
}

const factoryAddresses: Record<string, string> = proxyFactories.networkAddresses
const legacyAddresses: Record<string, string> = legacyProxyFactories.networkAddresses
const legacyFactoryExceptions = { '100': '' } // legacy xDai factory is incomaptible with others

const Copycat = (): React.ReactElement => {
  const [txServiceHosts, setTxServiceHosts] = useState<Record<string, string>>({})
  const [safeAddress, setSafeAddress] = useState<string>('')
  const [chainId, setChainId] = useState<string>('')
  const [newChainId, setNewChainId] = useState<string>('')
  const [creation, setCreation] = useState<CreationInfo|null>(null)
  const [newSafeUrl, setNewSafeUrl] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const { walletProvider } = useWeb3ModalProvider()
  const { address: walletAddress } = useWeb3ModalAccount()

  // If the Safe was created with a legacy 1.1.1 factory, use that for the new Safe
  let supportedFactoryAddress: Record<string, string> = {}
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
    if (!creation || !walletAddress) return

    // Get transaction info
    let txInfo = undefined
    try {
      txInfo = await getTransactionInfo(walletProvider, chainId, creation.transactionHash)
    } catch (err) {
      setMessage((err as Error).message)
      return
    }

    setMessage(`Switching to ${Chains[newChainId]} and creating a copy of the Safe`)

    // Create a copy of the Safe
    let hash = ''
    try {
      hash = await copySafe(walletProvider, newChainId, txInfo)
    } catch (err) {
      setMessage((err as Error).message)
    }

    if (hash) {
      setMessage(`Transaction created: ${hash}`)
      setNewSafeUrl(getSafeUrl(newChainId, safeAddress))
    }
  }

  // Get the list of tx-service hosts
  useEffect(() => {
    getChainConfigs()
      .then((data) => {
        setTxServiceHosts(data.results.reduce((acc: Record<string, string>, cur: { chainId: string, transactionService: string }) => {
          acc[cur.chainId] = cur.transactionService
          return acc
        }, {}))
      })
  }, [])

  // Request the Safe creation tx from the Transaction Service
  useEffect(() => {
    setCreation(null)

    if (chainId && safeAddress && txServiceHosts[chainId]) {
      setMessage('')

      setMessage('Getting creation transaction...')

      getCreationInfo(txServiceHosts[chainId], safeAddress)
        .then((data) => {
          setCreation(data)
          setMessage('')
        })
        .catch((err) => {
          console.error(err)
          setMessage('Failed to load creation transaction')
        })
    }
  }, [chainId, safeAddress, txServiceHosts])

  return (
    <div className={styles.container}>
      <WalletHeader />

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
          Copying this Safe will result in a different address.<br />
          The official proxy factory address is <b>{factoryAddresses[chainId] || legacyAddresses[chainId]}</b>
        </div>
      )}

      {!isOwner && (
        <div className={styles.warning}>
          <strong>You&apos;re not the creator of that Safe!</strong><br />
          Copying this Safe will result in a different address.<br />
        </div>
      )}

      <div>
        <b>Safe address:</b>
        <AddressInput onChange={onSafeAddressInput} defaultValue={safeAddress}>
          {!safeAddress || !chainId ? '' : creation ? '✅' : '❌'}
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
            <select required onChange={(e) => setNewChainId(e.target.value)}>
              {Object.keys(Chains).map((key) => (
                <option key={key} value={key}>
                  {Chains[key]}
                  {safeAddress && chainId && !supportedFactoryAddress[key] ? ' (unsupported)' : ''}
                </option>
              ))}
            </select>
          </label>

          <div className={styles.submit}>
            <button type="submit" disabled={!creation || !walletAddress}>Copy Safe</button>
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
        <div className={message?.startsWith('Error') ? styles.error : styles.message}>
          {message.toString()}
        </div>
      )}
    </div>
  )
}

const WrappedCopycat = () => (
  <Web3ModalProvider><Copycat /></Web3ModalProvider>
)

export default WrappedCopycat
