'use client'
import { useEffect, useState } from 'react'
import { WagmiConfig, configureChains, createConfig } from 'wagmi'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
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
import { jsonRpcProvider } from 'wagmi/providers/jsonRpc'
import Loading from '@components/frames/Loading'

const url = 'https://qrflow.xyz'
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_ID)
  throw new Error(
    'You need to provide NEXT_PUBLIC_WALLETCONNECT_ID env variable'
  )
if (!process.env.NEXT_PUBLIC_BLASTAPI_ID)
  throw new Error('You need to provide NEXT_PUBLIC_BLASTAPI_ID env variable')
/* if (!process.env.NEXT_PUBLIC_INFURA_ID)
  throw new Error('You need to provide NEXT_PUBLIC_INFURA_ID env variable')
if (!process.env.NEXT_PUBLIC_ALCHEMY_ID)
  throw new Error('You need to provide NEXT_PUBLIC_ALCHEMY_ID env variable') */

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [
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
  ],
  [
    jsonRpcProvider({
      rpc: (chain) => {
        const blastapi = process.env.NEXT_PUBLIC_BLASTAPI_ID
        const subdomain =
          chain.name === 'Sepolia'
            ? 'eth-sepolia'
            : chain.name === 'Polygon Mumbai'
              ? 'polygon-testnet'
              : chain.name === 'Arbitrum Sepolia'
                ? 'arbitrum-sepolia'
                : chain.name === 'Optimism Sepolia'
                  ? 'optimism-sepolia'
                  : chain.name === 'Ethereum'
                    ? 'eth-mainnet'
                    : chain.name === 'Polygon'
                      ? 'polygon-mainnet'
                      : chain.name === 'Arbitrum One'
                        ? 'arbitrum-one'
                        : chain.name === 'OP Mainnet'
                          ? 'optimism-mainnet'
                          : chain.name === 'Gnosis'
                            ? 'gnosis-mainnet'
                            : chain.name === 'BNB Smart Chain'
                              ? 'bsc-mainnet'
                              : chain.name === 'Avalanche'
                                ? 'ava-mainnet'
                                : 'error'
        return {
          http: `https://${subdomain}.blastapi.io/${blastapi}${chain.name === 'Avalanche' ? '/ext/bc/C/rpc' : ''}`,
          webSocket: `wss://${subdomain}.blastapi.io/${blastapi}${chain.name === 'Avalanche' ? '/ext/bc/C/ws' : ''}`,
        }
      },
    }),
  ]
)

const config = createConfig(
  getDefaultConfig({
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
    chains,
    publicClient,
    webSocketPublicClient,
    enableWebSocketPublicClient: true,
    //alchemyId: process.env.NEXT_PUBLIC_ALCHEMY_ID,
    //infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    appName: 'QR Flow',
    appDescription:
      'Create claimable tickets to send ERC20 tokens without specifying any wallet address. Simple as using cash!',
    appUrl: url,
    appIcon: url + '/512x512.png',
  })
)

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
    <WagmiConfig config={config}>
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
    </WagmiConfig>
  ) : (
    <Loading />
  )
}
