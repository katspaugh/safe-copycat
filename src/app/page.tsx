import Head from 'next/head'
import Copycat from '../components/Copycat'

export default function Home() {
  return (
    <div>
      <Head>
        <title>Safe Copycat</title>
        <meta name="description" content="Copy a Safe Account to another chain" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <Copycat />
      </main>

      <footer>
      </footer>
    </div>
  )
}
