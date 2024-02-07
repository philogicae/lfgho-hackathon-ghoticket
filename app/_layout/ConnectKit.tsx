'use client'
import { useEffect, useState } from 'react'
import { WagmiProvider, createConfig, fallback, http, webSocket } from 'wagmi'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import {
  sepolia,
  polygonMumbai,
  arbitrumSepolia,
  optimismSepolia,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  gnosis,
  bsc,
  avalanche,
} from 'wagmi/chains'
import Loading from '@components/frames/Loading'

const url = 'https://qrflow.xyz'
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_ID)
  throw new Error(
    'You need to provide NEXT_PUBLIC_WALLETCONNECT_ID env variable'
  )
if (!process.env.NEXT_PUBLIC_BLASTAPI_ID)
  throw new Error('You need to provide NEXT_PUBLIC_BLASTAPI_ID env variable')
if (!process.env.NEXT_PUBLIC_BLASTAPI_ID_2)
  throw new Error('You need to provide NEXT_PUBLIC_BLASTAPI_ID_2 env variable')

const chains = [
  sepolia,
  polygonMumbai,
  arbitrumSepolia,
  optimismSepolia,
  mainnet,
  polygon,
  arbitrum,
  optimism,
  gnosis,
  bsc,
  avalanche,
] as const

export const txType: Record<number, 'eip1559' | 'legacy'> = {
  [sepolia.id]: 'eip1559',
  [polygonMumbai.id]: 'eip1559',
  [arbitrumSepolia.id]: 'eip1559',
  [optimismSepolia.id]: 'eip1559',
  [mainnet.id]: 'eip1559',
  [polygon.id]: 'eip1559',
  [arbitrum.id]: 'eip1559',
  [optimism.id]: 'eip1559',
  [gnosis.id]: 'eip1559',
  [bsc.id]: 'eip1559',
  [avalanche.id]: 'eip1559',
}

const blastapi = process.env.NEXT_PUBLIC_BLASTAPI_ID
const blastapi2 = process.env.NEXT_PUBLIC_BLASTAPI_ID_2
const subdomain = {
  Sepolia: 'eth-sepolia',
  'Polygon Mumbai': 'polygon-testnet',
  'Arbitrum Sepolia': 'arbitrum-sepolia',
  'OP Sepolia': 'optimism-sepolia',
  Ethereum: 'eth-mainnet',
  Polygon: 'polygon-mainnet',
  'Arbitrum One': 'arbitrum-one',
  'OP Mainnet': 'optimism-mainnet',
  Gnosis: 'gnosis-mainnet',
  'BNB Smart Chain': 'bsc-mainnet',
  Avalanche: 'ava-mainnet',
}
const transports = Object.assign(
  {},
  ...chains.map((chain) => ({
    [chain.id]: fallback([
      webSocket(
        `wss://${subdomain[chain.name]}.blastapi.io/${blastapi}${chain.name === 'Avalanche' ? '/ext/bc/C/ws' : ''}`
      ),
      webSocket(
        `wss://${subdomain[chain.name]}.blastapi.io/${blastapi2}${chain.name === 'Avalanche' ? '/ext/bc/C/ws' : ''}`
      ),
      http(
        `https://${subdomain[chain.name]}.blastapi.io/${blastapi}${chain.name === 'Avalanche' ? '/ext/bc/C/rpc' : ''}`
      ),
      http(
        `https://${subdomain[chain.name]}.blastapi.io/${blastapi2}${chain.name === 'Avalanche' ? '/ext/bc/C/rpc' : ''}`
      ),
      http(chain.rpcUrls.default.http[0]),
    ]),
  }))
)

const config = createConfig(
  getDefaultConfig({
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
    chains,
    transports,
    appName: 'QR Flow',
    appDescription:
      'Create claimable tickets to send ERC20 tokens without specifying any wallet address. Simple as using cash!',
    appUrl: url,
    appIcon: url + '/512x512.png',
  })
)
const queryClient = new QueryClient()

export default function ConnectKit({
  children,
}: {
  children: React.ReactNode
}) {
  const [isReady, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return isReady ? (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider
          theme="midnight"
          options={{
            embedGoogleFonts: true,
            disclaimer: (
              <span className="text-cyan-400 !font-mono tracking-tight">
                QR Flow is an experimental project
              </span>
            ),
          }}
          customTheme={{
            '--ck-connectbutton-font-size': '15px',
            '--ck-connectbutton-background': '#01218c',
            '--ck-connectbutton-hover-background': '#002aba',
            '--ck-connectbutton-active-background': '#002aba',
            '--ck-font-family':
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            '--ck-qr-dot-color': '#00FFFF',
          }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  ) : (
    <Loading />
  )
}
