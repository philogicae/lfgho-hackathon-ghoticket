'use client'
import { useEffect, useState } from 'react'
import { WagmiConfig, createConfig } from 'wagmi'
import { ConnectKitProvider, getDefaultConfig } from 'connectkit'
import { sepolia, mainnet } from 'wagmi/chains'
import Loading from '@components/frames/Loading'

const url = !process.env.NEXT_PUBLIC_URL
  ? 'https://ghoticket.on-fleek.app'
  : process.env.NEXT_PUBLIC_URL
if (!process.env.NEXT_PUBLIC_WALLETCONNECT_ID) {
  throw new Error(
    'You need to provide NEXT_PUBLIC_WALLETCONNECT_ID env variable'
  )
}
if (!process.env.NEXT_PUBLIC_INFURA_ID) {
  throw new Error('You need to provide NEXT_PUBLIC_INFURA_ID env variable')
}

const config = createConfig(
  getDefaultConfig({
    walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_ID,
    infuraId: process.env.NEXT_PUBLIC_INFURA_ID,
    chains: [sepolia, mainnet],
    appName: 'GhoTicket',
    appDescription: 'Your App Description',
    appUrl: url,
    appIcon: url + '/512x512.png',
  })
)

export default function Web3Modal({ children }: { children: React.ReactNode }) {
  const [isReady, setReady] = useState(false)
  useEffect(() => {
    setReady(true)
  }, [])
  return isReady ? (
    <WagmiConfig config={config}>
      <ConnectKitProvider
        theme="midnight"
        mode="dark"
        options={{
          embedGoogleFonts: true,
          disclaimer: (
            <span className="text-cyan-400 !font-mono tracking-tight">
              GhoTicket is an experimental project
            </span>
          ),
        }}
      >
        {children}
      </ConnectKitProvider>
    </WagmiConfig>
  ) : (
    <Loading />
  )
}
