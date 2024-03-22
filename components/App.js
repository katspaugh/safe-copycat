import { reactive } from '../utils/reactive.js'
import { getCreationInfo, getChainConfigs } from '../services/tx-service.js'
import { Component, el } from '../utils/dom.js'
import { CopyFormPreview } from '../components/CopyFormPreview.js'

export function App() {
  let prevChainId = null
  let prevSafeAddress = null

  // Components
  const copyFormPreview = CopyFormPreview({
    onSubmit: async (data) => {
      console.log('Submit', data)
    },

    onChange: async (data) => {
      state.chainId = data.fromChain
      state.safeAddress = data.address

      if (prevChainId !== state.chainId || prevSafeAddress !== state.safeAddress) {
        prevChainId = state.chainId
        prevSafeAddress = state.safeAddress

        state.creationInfo = null
        // Fetch creation info
        if (state.chainId && state.safeAddress) {
          const txServiceHost = state.chainConfigs.find((config) => config.chainId === state.chainId).transactionService
          try {
            state.creationInfo = await getCreationInfo(txServiceHost, state.safeAddress)
          } catch (e) {
            console.error('Failed to get creation info', e)
          }
        }
      }
    },
  })

  // State
  const state = reactive(
    {
      chainId: null,
      safeAddress: null,
      chainConfigs: [],
      creationInfo: null,
    },
    () => copyFormPreview.render(state),
  )

  // Fetch chain configs
  getChainConfigs()
    .then((data) => {
      state.chainConfigs = data.results
    })
    .catch((e) => {
      console.error('Failed to fetch chain configs', e)
    })

  return Component({
    children: [copyFormPreview.render(state)],

    style: {
      width: '480px',
      maxWidth: '90vw',
      margin: '0 auto',
      fontFamily: 'sans-serif',
    },

    render() {
      copyFormPreview.render(state)
    },
  })
}
