import { Component } from '../utils/dom.js'

export function Button({ label = '', type = 'button', style }) {
  return Component({
    tag: 'button',

    children: [label],

    props: {
      type,
    },

    style,
  })
}
