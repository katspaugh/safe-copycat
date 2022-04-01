import styles from './styles.module.css'

interface WalletHeaderProps {
  walletAddress?: string
  onConnect: () => Promise<string>
}

const truncateAddress = (address: string): string => {
  return address.slice(0, 6) + '...' + address.slice(-4)
}

const WalletHeader = ({ walletAddress, onConnect }: WalletHeaderProps) => {
  const onConnectClick = async (e: React.SyntheticEvent) => {
    e.preventDefault()
    onConnect()
  }

  return (
    <header className={styles.header}>
      {walletAddress ? (
        <button disabled>{truncateAddress(walletAddress)}</button>
      ) : (
        <button onClick={onConnectClick}>Connect wallet</button>
      )}
    </header>
  )
}

export default WalletHeader
