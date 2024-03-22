import { reactive } from '../utils/reactive.js'
import { getCreationInfo, getChainConfigs } from '../services/tx-service.js'
import { Component } from '../utils/dom.js'
import { CopyFormPreview } from '../components/CopyFormPreview.js'
import { ErrorMessage } from '../components/ErrorMessage.js'
import { switchChain, sendTransaction, getTransactionByHash } from '../services/ethereum.js'

export function App() {
  let prevChainId = null
  let prevSafeAddress = null

  // Components
  const copyFormPreview = CopyFormPreview({
    onSubmit: async (data) => {
      const { creationInfo } = state
      if (!creationInfo) {
        state.error = 'No creation info'
        return
      }

      state.error = null

      try {
        await switchChain(data.fromChain)
      } catch (e) {
        state.error = 'Failed to switch chain. ' + e.message
        return
      }

      let creationTx
      try {
        creationTx = await getTransactionByHash(creationInfo.transactionHash)
      } catch (e) {
        state.error = 'Failed to get creation transaction. ' + e.message
        return
      }

      try {
        await switchChain(data.toChain)
      } catch (e) {
        state.error = 'Failed to switch chain.' + e.message
        return
      }

      try {
        const txHash = await sendTransaction({
          from: creationTx.from,
          to: creationTx.to,
          value: creationTx.value,
          data: creationTx.input,
        })

        console.log('Transaction sent', txHash)
      } catch (e) {
        state.error = 'Failed to send transaction. ' + e.message
      }
    },

    onChange: async (data) => {
      state.chainId = data.fromChain
      state.safeAddress = data.address

      if (prevChainId !== state.chainId || prevSafeAddress !== state.safeAddress) {
        prevChainId = state.chainId
        prevSafeAddress = state.safeAddress

        state.error = null
        state.creationInfo = null

        // Fetch creation info
        if (state.chainId && state.safeAddress) {
          const txServiceHost = state.chainConfigs.find((config) => config.chainId === state.chainId).transactionService
          try {
            state.creationInfo = await getCreationInfo(txServiceHost, state.safeAddress)
          } catch (e) {
            state.error = 'Failed to get creation info. ' + e.message
          }
        }
      }
    },
  })

  const errorMessage = ErrorMessage()

  // State
  const state = reactive(
    {
      error: null,
      chainId: null,
      safeAddress: null,
      creationInfo: null,
      chainConfigs: [],
    },
    () => {
      errorMessage.render({ message: state.error })

      if (!state.error) {
        copyFormPreview.render(state)
      }
    },
  )

  return Component({
    children: [errorMessage.render(), copyFormPreview.render(state)],

    style: {
      width: '480px',
      maxWidth: '90vw',
      margin: '0 auto',
      fontFamily: 'sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    },

    async render() {
      // Fetch chain configs
      try {
        state.chainConfigs = await getChainConfigs()
      } catch (e) {
        console.error(e)
        state.error = 'Failed to get chain configs. ' + e.message
      }
    },
  })
}
