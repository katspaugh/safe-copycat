import React from 'react'
import styles from './styles.module.css'

const TextCopy = ({ text }: { text?: string }) => {
  const copy = (e: React.SyntheticEvent<HTMLInputElement>) => {
    const input = e.target as any
    input.select()
    document.execCommand('copy')
    input.blur()
  }

  return (
    <div className={styles.container}>
      <input onFocus={copy} defaultValue={text || ''} spellCheck={false} key={text} />
    </div>
  )
}

export default TextCopy