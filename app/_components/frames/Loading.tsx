'use client'
import { FaCircleNotch } from 'react-icons/fa6'

export default function Loading() {
  return (
    <div className="absolute flex flex-col items-center manual-y-center w-full h-full">
      <FaCircleNotch className="mb-6 text-5xl animate-spin" />
      <div className="text-2xl font-bold">GhoTicket</div>
    </div>
  )
}
