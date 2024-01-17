'use client'
import { Image } from '@nextui-org/react'

export default function Navbar({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute flex flex-col w-full h-full items-center justify-center">
      <div className="flex flex-col w-full h-full items-center justify-start">
        <div className="flex flex-row w-full h-36 items-center justify-start py-2 px-4">
          <a href={window.location.origin + '/#/'}>
            <Image
              src="/512x512.png"
              alt="GhoTicket"
              width={128}
              height={128}
              loading="eager"
              disableSkeleton={true}
            />
          </a>
          <a
            href={window.location.origin + '/#/'}
            className="text-3xl font-mono"
          >
            GhoTicket
          </a>
        </div>
        <div className="flex flex-col w-full h-full items-start justify-center p-4">
          {children}
        </div>
        <div className="flex flex-row w-full h-9 items-center justify-between p-2 text-sm font-mono">
          <a href="https://github.com/philogicae/lfgho-hackathon-ghoticket">
            LFGHO Hackathon Project 2024
          </a>
          <a href="https://twitter.com/philogicae">@Philogicae</a>
        </div>
      </div>
    </div>
  )
}
