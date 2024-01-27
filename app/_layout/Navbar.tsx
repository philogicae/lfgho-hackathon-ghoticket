'use client'
import { Image } from '@nextui-org/react'
import { ConnectKitButton } from 'connectkit'
import { FaEthereum, FaXTwitter, FaGithub, FaQrcode } from 'react-icons/fa6'

export default function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute flex flex-col w-full h-full items-center justify-center"
      id="layout"
    >
      <div className="flex flex-col w-full h-full items-center justify-start">
        <div
          className="flex flex-col sm:flex-row w-full h-36 items-center justify-between"
          id="topbar"
        >
          <a
            className="flex flex-row items-center"
            href={window.location.origin + '/#/'}
          >
            <Image
              src="/512x512.png"
              alt="QR Flow"
              width={100}
              height={100}
              loading="eager"
              disableSkeleton={true}
            />
            <span className="text-4xl font-sans pl-1.5 halo-text">QR</span>
            <FaQrcode className="text-3xl px-1.5" />
            <span className="text-4xl font-sans pr-5 sm:pr-0 halo-text">
              Flow
            </span>
          </a>
          <div className="sm:pr-4">
            <ConnectKitButton showBalance={true} />
          </div>
        </div>
        <div className="flex flex-col w-full h-full items-start justify-center pt-8 sm:pt-0 px-2">
          {children}
        </div>
        <div className="flex flex-row w-full h-9 items-center justify-between p-2 text-sm font-mono text-[#1938fc]">
          <a
            href="https://ethglobal.com/showcase/ghoticket-0hkpx"
            className="flex flex-row hover:underline items-center justify-center hover:text-cyan-300 active:text-cyan-300"
          >
            ETHGlobal-2024 <FaEthereum className="px-1 text-lg" /> LFGHO
            Hackathon
          </a>
          <div className="flex flex-row text-lg pb-0.5">
            <a
              href="https://github.com/philogicae"
              className="pr-1 hover:text-cyan-300 active:text-cyan-300"
            >
              <FaGithub />
            </a>
            <a href="https://twitter.com/philogicae">
              <FaXTwitter className="hover:text-cyan-300 active:text-cyan-300" />
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
