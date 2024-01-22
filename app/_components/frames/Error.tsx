'use client'
import { FaArrowLeft, FaBan } from 'react-icons/fa6'

export default function Error() {
  return (
    <div className="flex flex-col items-center manual-y-center w-full h-full mb-16">
      <FaBan className="mb-6 text-6xl" />
      <span className="text-2xl font-bold mb-6">404 Not Found</span>
      <a
        className={
          'w-20 h-8 text-lg bg-sky-950 rounded-lg cursor-pointer hover:bg-sky-900 hover:shadow-lg flex items-center justify-center font-mono tracking-tighter font-semibold'
        }
        href={window.location.origin + '/#/'}
      >
        <div className="text-sm flex flex-row items-center justify-center">
          <FaArrowLeft />
          <span className="pl-2">MENU</span>
        </div>
      </a>
    </div>
  )
}
