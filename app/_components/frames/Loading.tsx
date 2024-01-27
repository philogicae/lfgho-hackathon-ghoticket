'use client'
import { FaCircleNotch, FaQrcode } from 'react-icons/fa6'

export default function Loading() {
  return (
    <div className="absolute flex flex-col items-center manual-y-center w-full h-full">
      <FaCircleNotch className="mb-6 text-6xl animate-spin" />
      <div className="flex flex-row items-center">
        <span className="text-3xl font-sans">QR</span>
        <FaQrcode className="text-2xl px-1" />
        <span className="text-3xl font-sans">Flow</span>
      </div>
    </div>
  )
}
