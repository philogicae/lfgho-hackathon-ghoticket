'use client'
import { FaLinkSlash } from 'react-icons/fa6'

export default function WrongChain() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full mb-10">
      <FaLinkSlash className="mb-4 text-6xl" />
      <span className="text-xl font-bold w-44 text-center">
        Chain Not Supported
      </span>
    </div>
  )
}
