import { Component, el } from '../utils/dom.js'
import { Label } from './Label.js'

export function AddressInput({ label = '', onChange }) {
  const input = el('input', {
    type: 'text',
    placeholder: '0x...',
    pattern: '0x[0-9a-fA-F]{40}',
    required: true,

    onchange: () => onChange(input.value),

    style: {
      width: '100%',
    },
  })

  const labelEl = Label({ label }).render()

  return Component({
    children: [labelEl, input],

    style: {
      display: 'flex',
      gap: '0.5em',
    },

    render: ({ value = '' } = {}) => {
      if (input.value !== value) {
        input.value = value
      }
    },
  })
}
