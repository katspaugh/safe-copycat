import { Component, el } from '../utils/dom.js'

const safeUrlTemplate = `https://app.safe.global/home?safe=`

const div = (...children) => el('div', {}, children)
const b = (...children) => el('b', {}, children)
const a = (props, ...children) => el('a', props, children)

const shortenHash = (hash) => hash.slice(0, 6) + '…' + hash.slice(-4)

export function CreationCard() {
  const component = Component({
    style: {
      width: '100%',
      display: 'flex',
      gap: '0.5em',
      flexDirection: 'column',
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

      const safeUrl = `${safeUrlTemplate}${chainInfo.shortName}:${safeAddress}`

      const ownerUrl = (address) => chainInfo.blockExplorerUriTemplate.address.replace(/{{address}}/g, address)

      const ownerAddresses = creationInfo.dataDecoded.parameters[0].value

      container.append(
        div(
          b('Safe: '),
          a(
            { href: safeUrl, target: '_blank' },
            `${safeUrlTemplate}${chainInfo.shortName}:${shortenHash(safeAddress)}`,
          ),
        ),

        div(b('Created: '), `${new Date(creationInfo.created).toLocaleDateString()}`),

        div(
          b('Creation hash: '),
          a({ href: blockExplorerUrl, target: '_blank' }, shortenHash(creationInfo.transactionHash)),
        ),

        div(
          b('Owners: '),
          ...ownerAddresses.map((address) =>
            div(a({ href: ownerUrl(address), target: '_blank' }, shortenHash(address))),
          ),
        ),
      )
    },
  })

  return component
}
