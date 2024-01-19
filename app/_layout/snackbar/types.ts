'use client'
import { MutableRefObject } from 'react'

export type SnackbarType = {
  key: string
  type: 'success' | 'error' | 'warning' | 'info'
  text: React.ReactNode
  link?: string
  duration?: number
  trigger?: MutableRefObject<boolean>
  className?: string
}

export type SnackbarProps = Omit<SnackbarType, 'key'> & {
  onClose: () => void
}
