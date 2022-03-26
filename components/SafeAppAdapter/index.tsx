import SafeProvider, { useSafeAppsSDK } from '@gnosis.pm/safe-apps-react-sdk'
import Copycat from '../Copycat'

const Consumer = () => {
  const { safe } = useSafeAppsSDK()
  return (
    <Copycat safe={safe} />
  )
}

const SafeAppAdapter = () =>{
  return (
    <SafeProvider loader={<h1>Waiting for Safe...</h1>}>
      <Consumer />
    </SafeProvider>
  )
}

export default SafeAppAdapter