'use client'
import { useEffect, useState } from 'react'
import { SnackbarProps } from './types'
import { IconType } from 'react-icons'
import { cn } from '@utils/tw'
import {
  FaCircleCheck,
  FaTriangleExclamation,
  FaCircleExclamation,
  FaCircleInfo,
  FaChevronRight,
  FaLink,
} from 'react-icons/fa6'

const icons: { [key: string]: IconType } = {
  success: FaCircleCheck,
  error: FaTriangleExclamation,
  warning: FaCircleExclamation,
  info: FaCircleInfo,
}
const colors: { [key: string]: string } = {
  success: 'bg-green-700',
  error: 'bg-red-700',
  warning: 'bg-amber-700',
  info: 'bg-blue-700',
}

export default function Notification({
  id,
  type,
  text,
  link,
  duration = 5,
  chrono = false,
  trigger,
  className,
  onClose,
}: SnackbarProps & { id: string }) {
  const Icon = icons[type]
  const [seconds, setSeconds] = useState(chrono ? 1 : duration)
  const timer = chrono || duration > 0 ? seconds : '•'
  useEffect(() => {
    if (typeof trigger === 'object' && !trigger.current)
      setTimeout(onClose, 750)
    if (chrono) {
      const timer = setInterval(() => {
        setSeconds(seconds + 1)
      }, 950)
      return () => clearInterval(timer)
    } else if (duration > 0) {
      const timer = setInterval(() => {
        setSeconds(seconds - 1)
        if (seconds === 1) {
          onClose()
          clearInterval(timer)
        }
      }, 950)
      return () => clearInterval(timer)
    }
  })
  return (
    <div
      id={id}
      className={cn(
        'flex flex-row items-center justify-center whitespace-nowrap rounded-lg py-2 pl-3 pr-2 text-sm w-52 pointer-events-auto mr-1.5 mt-1 z-50',
        colors[type],
        className
      )}
    >
      <Icon className="w-4 h-4" />
      <div className="w-full px-3 flex flex-row items-center">
        <span>{text}</span>
        {link && (
          <a
            className="pl-2 underline"
            href={link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaLink className="ml-1 w-5 h-5 text-cyan-300" />
          </a>
        )}
      </div>
      <span>{timer}</span>
      <button onClick={onClose}>
        <FaChevronRight className="w-3 h-3" />
      </button>
    </div>
  )
}
