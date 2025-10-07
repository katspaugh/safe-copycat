'use client'

import React, { useState, useEffect } from 'react'
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import proxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.3.0/proxy_factory.json'
import legacyProxyFactories from '@gnosis.pm/safe-deployments/src/assets/v1.1.1/proxy_factory.json'
import { getCreationInfo, CreationInfo, getChainConfigs, decodeFactoryMethod } from '../../utils/tx-service'
import { Chains, ShortNames, copySafe, copySafeWithCREATE2, getTransactionInfo, getTransactionInfoReadOnly } from '../../utils/eth'
import { getSafeInfoReadOnly, decodeInitialSetup, compareSetups, createSyncTransaction } from '../../utils/safe-sync'
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
  const [originalTxInput, setOriginalTxInput] = useState<string>('')
  const [callbackAddress, setCallbackAddress] = useState<string>('')
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

  // Check if the Safe was deployed with CREATE2 (deterministic address)
  const usesCREATE2 = creation?.factoryMethod === 'createProxyWithCallback' ||
                      creation?.factoryMethod === 'createProxyWithNonce'

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

    setMessage(`Switching to ${Chains[newChainId]} and creating a copy of the Safe`)

    // Create a copy of the Safe
    let hash = ''
    try {
      if (usesCREATE2) {
        // Use CREATE2 deployment for deterministic addresses (any deployer can recreate)
        const targetFactoryAddress = supportedFactoryAddress[newChainId]
        if (!targetFactoryAddress) {
          throw new Error(`Factory not available on ${Chains[newChainId]}`)
        }
        if (!originalTxInput) {
          throw new Error('Original transaction input not available')
        }
        hash = await copySafeWithCREATE2(walletProvider, newChainId, targetFactoryAddress, creation, originalTxInput, safeAddress)
      } else {
        // Fallback to old method (requires original creator)
        const txInfo = await getTransactionInfo(walletProvider, chainId, creation.transactionHash)
        hash = await copySafe(walletProvider, newChainId, txInfo)
      }
    } catch (err) {
      // Clean up error messages for better readability
      let errorMessage = (err as Error).message

      // Extract just the important part from ethers.js errors
      if (errorMessage.includes('CALL_EXCEPTION')) {
        errorMessage = 'Transaction would fail. Possible reasons:\n• Safe already exists at this address\n• Required contracts not available on this chain\n• Invalid deployment parameters'
      }

      // Truncate very long error messages
      if (errorMessage.length > 500) {
        errorMessage = errorMessage.substring(0, 500) + '...\n\n(See browser console for full error)'
        console.error('Full error:', err)
      }

      setMessage(errorMessage)
    }

    if (hash) {
      setMessage(`Transaction created: ${hash}`)
      setNewSafeUrl(getSafeUrl(newChainId, safeAddress))

      // After successful deployment, wait for the Safe to be deployed and check if we should sync the configuration
      waitForSafeDeployment(hash, newChainId, 0)
    }
  }

  // Recursively wait for Safe deployment to complete
  const waitForSafeDeployment = async (txHash: string, targetChainId: string, attempt: number) => {
    const maxAttempts = 30 // 30 attempts * 2s = 60s max wait time

    if (attempt >= maxAttempts) {
      setMessage('Safe deployed successfully. (Timeout waiting for deployment confirmation)')
      return
    }

    try {
      // Check if the Safe contract has been deployed on the target chain
      if (!walletProvider) {
        setMessage('Safe deployed successfully. (No wallet provider available)')
        return
      }

      const { BrowserProvider } = await import('ethers')
      const provider = new BrowserProvider(walletProvider)

      // First check if transaction is mined
      const receipt = await provider.getTransactionReceipt(txHash)

      if (!receipt) {
        // Transaction not mined yet, wait and retry
        setMessage(`Waiting for deployment... (${attempt + 1}/${maxAttempts})`)
        setTimeout(() => waitForSafeDeployment(txHash, targetChainId, attempt + 1), 2000)
        return
      }

      // Check if Safe contract exists at the address
      const code = await provider.getCode(safeAddress)

      if (code === '0x' || code === '0x0') {
        // Contract not deployed yet, wait and retry
        setMessage(`Deployment confirmed, waiting for contract... (${attempt + 1}/${maxAttempts})`)
        setTimeout(() => waitForSafeDeployment(txHash, targetChainId, attempt + 1), 2000)
        return
      }

      // Safe is deployed, now check configuration
      checkAndSyncConfiguration()
    } catch (err) {
      console.error('Error checking deployment status:', err)
      // Retry on error
      setTimeout(() => waitForSafeDeployment(txHash, targetChainId, attempt + 1), 2000)
    }
  }

  // Check if Safe configuration has changed and offer to sync
  const checkAndSyncConfiguration = async () => {
    if (!creation || !walletProvider || !chainId || !safeAddress) return

    try {
      // Get current Safe info from the original chain (read-only)
      setMessage('Checking if Safe configuration has changed...')
      const currentInfo = await getSafeInfoReadOnly(chainId, safeAddress)

      // Decode initial setup from creation data
      const initialInfo = decodeInitialSetup(creation.setupData)
      if (!initialInfo) {
        console.error('Could not decode initial setup')
        return
      }

      // Compare configurations
      const { isDifferent, changes } = compareSetups(initialInfo, currentInfo)

      if (isDifferent) {
        const changesList = changes.map((c) => `• ${c}`).join('\n')
        const userConfirmed = window.confirm(
          `The original Safe's configuration has changed since it was created:\n\n${changesList}\n\nWould you like to create a transaction to sync these changes to the new Safe?`
        )

        if (userConfirmed) {
          await syncSafeConfiguration(initialInfo, currentInfo)
        } else {
          setMessage('Sync skipped. Safe deployed successfully.')
        }
      } else {
        setMessage('Safe deployed successfully. Configuration is unchanged.')
      }
    } catch (err) {
      console.error('Failed to check configuration:', err)
      setMessage('Safe deployed successfully. (Could not check configuration changes)')
    }
  }

  // Create a Safe transaction to sync configuration
  const syncSafeConfiguration = async (initial: any, target: any) => {
    if (!walletProvider || !safeAddress) return

    try {
      setMessage('Creating sync transaction...')

      const txData = await createSyncTransaction(initial, target, safeAddress)

      // Open Safe transaction builder URL
      const safeTxUrl = `https://app.safe.global/${ShortNames[newChainId]}:${safeAddress}/transactions/tx-builder`

      setMessage(
        `Please create the sync transaction manually:\n\n1. Go to: ${safeTxUrl}\n2. Use these details:\n   To: ${txData.to}\n   Value: ${txData.value}\n   Data: ${txData.data.slice(0, 20)}...`
      )

      // Open in new tab
      window.open(safeTxUrl, '_blank')
    } catch (err) {
      console.error('Failed to create sync transaction:', err)
      setMessage(`Error creating sync transaction: ${(err as Error).message}`)
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
    setCallbackAddress('')

    if (chainId && safeAddress && txServiceHosts[chainId]) {
      setMessage('')

      setMessage('Getting creation transaction...')

      getCreationInfo(txServiceHosts[chainId], safeAddress)
        .then(async (data) => {
          // Fetch the actual transaction to get the factory method (without wallet)
          try {
            const txInfo = await getTransactionInfoReadOnly(chainId, data.transactionHash)
            const factoryInfo = decodeFactoryMethod(txInfo.input)
            if (factoryInfo) {
              data.factoryMethod = factoryInfo.method
              data.factoryParameters = factoryInfo.parameters
            }
            // Store the original transaction input for CREATE2 deployment
            setOriginalTxInput(txInfo.input)

            // Decode callback address if using createProxyWithCallback
            if (factoryInfo?.method === 'createProxyWithCallback') {
              // Decode the callback parameter (4th parameter in the method)
              // Skip method selector (4 bytes) and decode using ABI
              const { Interface } = await import('ethers')
              const iface = new Interface([
                'function createProxyWithCallback(address _singleton, bytes memory initializer, uint256 saltNonce, address callback)'
              ])
              try {
                const decoded = iface.parseTransaction({ data: txInfo.input })
                if (decoded && decoded.args[3]) {
                  setCallbackAddress(decoded.args[3])
                }
              } catch (e) {
                console.error('Failed to decode callback:', e)
              }
            }
          } catch (err) {
            console.error('Failed to decode factory method:', err)
          }
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

        <div className={styles.sponsor}>
          <a href="https://github.com/sponsors/katspaugh" target="_blank" rel="noreferrer">
            <svg viewBox="0 0 16 16" width="16" height="16" className={styles.sponsorIcon}>
              <path fill="currentColor" d="m8 14.25.345.666a.75.75 0 0 1-.69 0l-.008-.004-.018-.01a7.152 7.152 0 0 1-.31-.17 22.055 22.055 0 0 1-3.434-2.414C2.045 10.731 0 8.35 0 5.5 0 2.836 2.086 1 4.25 1 5.797 1 7.153 1.802 8 3.02 8.847 1.802 10.203 1 11.75 1 13.914 1 16 2.836 16 5.5c0 2.85-2.045 5.231-3.885 6.818a22.066 22.066 0 0 1-3.744 2.584l-.018.01-.006.003h-.002ZM4.25 2.5c-1.336 0-2.75 1.164-2.75 3 0 2.15 1.58 4.144 3.365 5.682A20.58 20.58 0 0 0 8 13.393a20.58 20.58 0 0 0 3.135-2.211C12.92 9.644 14.5 7.65 14.5 5.5c0-1.836-1.414-3-2.75-3-1.373 0-2.609.986-3.029 2.456a.749.749 0 0 1-1.442 0C6.859 3.486 5.623 2.5 4.25 2.5Z"></path>
            </svg>
            Sponsor
          </a>
        </div>
      </div>

      {!isSupported && (
        <div className={styles.warning}>
          <strong>Unsupported factory address!</strong><br />
          Copying this Safe will result in a different address.<br />
          The official proxy factory address is <b>{factoryAddresses[chainId] || legacyAddresses[chainId]}</b>
        </div>
      )}

      {!usesCREATE2 && !isOwner && (
        <div className={styles.warning}>
          <strong>You&apos;re not the creator of that Safe!</strong><br />
          Copying this Safe will result in a different address.<br />
        </div>
      )}

      {usesCREATE2 && !isOwner && (
        <div className={styles.success}>
          <strong>✅ CREATE2 deployment detected!</strong><br />
          This Safe can be deployed to the same address by anyone (not just the original creator).<br />
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
        <b>Method:</b>
        {creation?.factoryMethod || '...'}{' '}
        {usesCREATE2 ? '(CREATE2 ✅)' : ''}
      </div>

      {callbackAddress && (
        <div>
          <b>Callback:</b>
          {callbackAddress}
        </div>
      )}

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
          <button
            className={styles.closeButton}
            onClick={() => setMessage('')}
            aria-label="Close"
          >
            ×
          </button>
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
