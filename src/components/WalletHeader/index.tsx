import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react'
import { useWeb3Modal } from '@web3modal/ethers/react'
import styles from './styles.module.css'

const truncateAddress = (address: string): string => {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

const WalletHeader = () => {
  const { address } = useWeb3ModalAccount()
  const { open } = useWeb3Modal()

  const onConnectClick = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    open()
  }

  return (
    <header className={styles.header}>
      {address ? (
        <button disabled>{truncateAddress(address)}</button>
      ) : (
        <button onClick={onConnectClick}>Connect wallet</button>
      )}
    </header>
  )
}

export default WalletHeader
