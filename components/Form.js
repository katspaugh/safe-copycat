import { Component, el } from '../utils/dom.js'
import { AddressInput } from '../components/AddressInput.js'
import { Button } from '../components/Button.js'
import { Select } from '../components/Select.js'

export function Form({ onSubmit, onChange }) {
  const values = {
    address: '',
    fromChain: '',
    toChain: '',
  }

  const addressInput = AddressInput({
    label: 'Safe address',
    onChange: (value) => {
      values.address = value
      onChange(values)
    },
  })

  const fromChainSelect = Select({
    label: 'From chain',
    onChange: (value) => {
      values.fromChain = value
      onChange(values)
    },
  })

  const toChainSelect = Select({
    label: 'To chain',
    onChange: (value) => {
      values.toChain = value
      onChange(values)
    },
  })

  const submitButton = Button({
    label: 'Submit',
    type: 'submit',
    style: {
      width: '100%',
      padding: '0.5em',
      fontSize: '1em',
      marginTop: '0.5em',
    },
  })

  return Component({
    tag: 'form',

    children: [addressInput.render(), fromChainSelect.render(), toChainSelect.render(), submitButton.render()],

    style: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '1em',
      padding: '1em',
      margin: '0 1em',
      border: '1px solid #ccc',
      borderRadius: '0.5em',
    },

    props: {
      onsubmit: (e) => {
        e.preventDefault()
        onSubmit(values)
      },
    },

    render: ({ chainConfigs = [] } = {}) => {
      if (chainConfigs) {
        const chainOptions = chainConfigs.map((config) => ({ value: config.chainId, label: config.chainName }))
        fromChainSelect.render({ options: chainOptions })
        toChainSelect.render({ options: chainOptions })
      }
    },
  })
}
