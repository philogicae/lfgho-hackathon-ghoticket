'use client'
import { cn, ClassName } from '@utils/tw'

export default function Button({
  label,
  className,
  ...props
}: {
  label: React.ReactNode
  className?: ClassName
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any
}) {
  return (
    <button
      {...props}
      className={cn(
        'px-4 h-10 text-lg bg-sky-950 rounded-lg cursor-pointer hover:bg-sky-900 hover:shadow-lg flex items-center justify-center font-mono tracking-tighter font-semibold',
        className
      )}
    >
      {label}
    </button>
  )
}
