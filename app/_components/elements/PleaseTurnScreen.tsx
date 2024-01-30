'use client'
import { FaArrowsRotate } from 'react-icons/fa6'

export default function PleaseTurnScreen() {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full mb-10">
      <FaArrowsRotate className="mb-4 text-6xl" />
      <span className="text-xl font-bold w-44 text-center">
        Turn Your Screen
      </span>
    </div>
  )
}
