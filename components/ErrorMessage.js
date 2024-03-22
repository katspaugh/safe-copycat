import { Component, el } from '../utils/dom.js'

export function ErrorMessage() {
  const span = el('span', {}, '')

  const component = Component({
    style: {
      display: 'none',
      color: 'red',
      padding: '10px',
      margin: '10px',
      border: '1px solid red',
      backgroundColor: 'white',
      borderRadius: '5px',
      position: 'fixed',
      right: '10px',
      top: '10px',
      zIndex: '1000',
      width: '300px',
      overflowWrap: 'break-word',
      whiteSpace: 'pre-wrap',
    },

    children: [span],

    render({ message = '' } = {}) {
      if (!message) {
        component.container.style.display = 'none'
        return
      }

      span.textContent = message.replace(/\. /g, '.\n\n')

      component.container.style.display = ''
    },
  })

  return component
}
