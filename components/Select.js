import { Component, el } from '../utils/dom.js'
import { Label } from './Label.js'

const option = ({ value, label }) => el('option', { value }, label || value)

export function Select({ label = '', onChange }) {
  const select = el('select', {
    required: true,

    style: {
      width: '100%',
      fontSize: '1em',
    },

    onchange: (e) => {
      onChange(e.target.value)
    },
  })

  const labelEl = Label({ label }).render()

  return Component({
    children: [labelEl, select],

    style: {
      display: 'flex',
      gap: '0.5em',
    },

    render: ({ options = [] } = {}) => {
      select.innerHTML = ''
      select.append(option({ value: '', label: 'Select...' }))
      select.append(...options.map(option))
    },
  })
}
