'use client'
import { Image } from '@nextui-org/react'
import { ConnectKitButton } from 'connectkit'

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
              alt="GhoTicket"
              width={100}
              height={100}
              loading="eager"
              disableSkeleton={true}
            />
            <span className="text-4xl font-mono pl-1 pr-5 sm:pr-0 halo-text">
              GhoTicket
            </span>
          </a>
          <div className="sm:pr-4">
            <ConnectKitButton showBalance={true} />
          </div>
        </div>
        <div className="flex flex-col w-full h-full items-start justify-center pt-4 px-2">
          {children}
        </div>
        <div className="flex flex-row w-full h-9 items-center justify-between p-2 text-sm font-mono text-cyan-400">
          <a href="https://github.com/philogicae/lfgho-hackathon-ghoticket">
            LFGHO Hackathon Project 2024
          </a>
          <a href="https://twitter.com/philogicae">@Philogicae</a>
        </div>
      </div>
    </div>
  )
}
