import { App } from './components/App.js'

const app = document.querySelector('#app')
if (app) {
  app.appendChild(App().render())
}
