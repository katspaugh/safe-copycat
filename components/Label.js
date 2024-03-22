import { Component } from '../utils/dom.js'

export function Label({ label = '' }) {
  return Component({
    tag: 'label',
    children: [label],
    style: {
      display: 'inline-block',
      minWidth: '7em',
    },
  })
}
