import React, { useState, useEffect, useRef, useCallback } from 'react'
import styles from './styles.module.css'

const ShortNames: Record<string, string> = {
  '1': 'eth',
  '4': 'rin',
  '100': 'gno',
  '137': 'matic',
  '42161': 'arb1'
}

const isAddressHex = (address: string): boolean => {
  return /0x[0-9a-fA-F]{40}/.test(address)
}

interface AddressInputProps {
  defaultValue?: string
  onChange: (address: string, chainId?: string) => unknown
}

const AddressInput = ({ onChange, defaultValue }: AddressInputProps): React.ReactElement => {
  const [addressValue, setAddressValue] = useState<string>()
  const [chainId, setChainId] = useState<string>()
  const addressInput = useRef<HTMLInputElement>()

  // Allow bare Ethereum addresses and EIP-1337 addresses with a prefix
  const onSafeAddressInput = useCallback(() => {
    const value = addressInput.current?.value || ''
    setAddressValue(value)

    if (!value) return
    const [, prefix, address] = value.match(/^([a-z0-9]+:)?(0x[0-9a-fA-F]{40})$/) || []

    let matchingChainId = undefined
    if (prefix) {
      const shortName = prefix.slice(0, -1)
      matchingChainId = Object.keys(ShortNames).find(key => ShortNames[key] === shortName) || undefined
      setChainId(matchingChainId || '')
    } else {
      setChainId(undefined)
    }
  
    onChange(
      isAddressHex(address) ? address : '',
      matchingChainId
    )
  }, [onChange, setChainId, setAddressValue])

  return (
    <span className={styles.container}>
      <input
        ref={addressInput}
        defaultValue={defaultValue}
        onChange={onSafeAddressInput}
        placeholder="eth:0x0000000000000000000000000000000000000000"
        spellCheck={false}
        minLength={42}
        required
      />
      {' '}
      {(addressValue && !isAddressHex(addressValue)) || chainId === '' ? '❌' : ''}
    </span>
  )
}

export default AddressInput
