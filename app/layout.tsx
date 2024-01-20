import './globals.css'
import type { Metadata, Viewport } from 'next'
import { Roboto } from 'next/font/google'
import ConnectKit from '@layout/ConnectKit'
import NextUI from '@layout/NextUI'
import Navbar from '@layout/Navbar'
import Snackbar from '@layout/Snackbar'
import Background from '@layout/Background'

const font = Roboto({
  subsets: ['latin'],
  variable: '--font-local',
  weight: '400',
  preload: true,
})

const url = !process.env.NEXT_PUBLIC_URL
  ? 'https://ghoticket.on-fleek.app'
  : process.env.NEXT_PUBLIC_URL

export const metadata: Metadata = {
  title: 'GhoTicket',
  description:
    'Generate claimable tickets to send GHO without specifying any wallet address. Simple as using cash. [LFGHO Hackathon 2024]',
  applicationName: 'GhoTicket',
  appLinks: {
    web: {
      url: url,
      should_fallback: true,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/images/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  metadataBase: new URL(url),
  openGraph: {
    title: 'GhoTicket',
    description:
      'Generate claimable tickets to send GHO without specifying any wallet address. Simple as using cash. [LFGHO Hackathon 2024]',
    url: url,
    siteName: 'GhoTicket',
    images: [
      {
        url: url + '/512x512.png',
        width: 512,
        height: 512,
      },
    ],
    locale: 'en-US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'GhoTicket',
    description:
      'Generate claimable tickets to send GHO without specifying any wallet address. Simple as using cash. [LFGHO Hackathon 2024]',
    site: '@philogicae',
    creator: '@philogicae',
    images: [url + '/512x512.png'],
  },
}

export const viewport: Viewport = {
  themeColor: 'black',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  if (typeof window !== 'undefined') {
    const storedVersion = localStorage.getItem('appVersion')
    if (storedVersion !== process.env.appVersion) {
      localStorage.setItem('appVersion', process.env.appVersion as string)
      window.location.reload()
    }
  }
  const csp = `default-src 'self' api.web3modal.com *.walletconnect.com *.walletconnect.org wss://relay.walletconnect.com wss://relay.walletconnect.org wss://www.walletlink.org/rpc *.infura.io; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' * blob: data:; script-src 'self' 'unsafe-eval' 'unsafe-inline'`
  return (
    <html lang="en" className={font.variable}>
      <head>
        <meta httpEquiv="Content-Security-Policy" content={csp} />
      </head>
      <body>
        <ConnectKit>
          <NextUI>
            <Background />
            <Navbar>
              <Snackbar>{children}</Snackbar>
            </Navbar>
          </NextUI>
        </ConnectKit>
      </body>
    </html>
  )
}
