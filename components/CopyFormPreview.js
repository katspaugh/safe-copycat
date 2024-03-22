import { Component, el } from '../utils/dom.js'
import { Form } from '../components/Form.js'
import { CreationCard } from '../components/CreationCard.js'

export function CopyFormPreview({ onSubmit, onChange }) {
  let prevConfigs = null

  const form = Form({
    onSubmit,
    onChange,
  })

  const creationCard = CreationCard()

  return Component({
    children: [
      el('img', {
        src: '/logo.svg',
        style: {
          width: '100px',
          height: '100px',
          display: 'block',
          marginBottom: '-1em',
        },
      }),

      form.render({}),
      creationCard.render({}),
    ],

    style: {
      width: '100%',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '1em',
    },

    render({ chainId, safeAddress, creationInfo, chainConfigs }) {
      creationCard.render({
        creationInfo,
        chainInfo: chainConfigs.find((c) => c.chainId === chainId),
        safeAddress: safeAddress,
      })

      if (prevConfigs !== chainConfigs) {
        form.render({ chainConfigs })
        prevConfigs = chainConfigs
      }
    },
  })
}
