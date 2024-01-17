'use client'
import { FaBan } from 'react-icons/fa6'

export default function Error() {
  return (
    <div className="flex flex-col items-center manual-y-center w-full h-full mb-16">
      <FaBan className="mb-6 text-6xl" />
      <span className="text-2xl font-bold">404 Not Found</span>
    </div>
  )
}
