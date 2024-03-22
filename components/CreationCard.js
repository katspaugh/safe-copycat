import { Component, el } from '../utils/dom.js'

const div = (...children) => el('div', {}, children)
const b = (...children) => el('b', {}, children)

const shortenHash = (hash) => hash.slice(0, 6) + '…' + hash.slice(-4)

export function CreationCard() {
  const component = Component({
    style: {
      width: '100%',
      display: 'flex',
      gap: '0.5em',
      flexDirection: 'column',
      margin: '1em 0',
      padding: '1em',
      border: '1px solid #ccc',
      borderRadius: '4px',
    },

    render: ({ creationInfo, chainInfo, safeAddress }) => {
      const { container } = component
      container.innerHTML = ''

      if (!creationInfo) {
        container.innerHTML = `Enter a Safe Address and select the chain to copy from`
        return
      }

      const blockExplorerUrl = chainInfo.blockExplorerUriTemplate.txHash.replace(
        /{{txHash}}/g,
        creationInfo.transactionHash,
      )
      const safeUrl = `https://app.safe.global/home?safe=${safeAddress}`

      container.append(
        div(b('Created on '), `${creationInfo.created}`),
        div(
          b('Transaction hash: '),
          el('a', { href: blockExplorerUrl, target: '_blank' }, shortenHash(creationInfo.transactionHash)),
        ),
        div(b('Safe: '), el('a', { href: safeUrl, target: '_blank' }, shortenHash(safeAddress))),
      )
    },
  })

  return component
}
