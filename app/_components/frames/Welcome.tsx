'use client'

import Button from '@components/elements/Button'
import { ClassName, cn } from '@utils/tw'
import { useNavigate } from 'react-router-dom'

const Triangle = ({ className }: { className: ClassName }) => {
  return (
    <div className={cn(className)}>
      <svg className="halo-polygon" viewBox="0 0 100 100">
        <polygon
          points="50 15, 100 100, 0 100"
          fill="transparent"
          stroke="cyan"
          strokeWidth="1"
        />
      </svg>
    </div>
  )
}

const Corner = ({
  label,
  route,
  className,
}: {
  label: string
  route: string
  className?: ClassName
}) => {
  const navigate = useNavigate()
  return (
    <Button
      label={label}
      className={cn('bg-blue-800 hover:bg-blue-700 w-24', className)}
      onClick={() => navigate(route)}
    />
  )
}

export default function Welcome() {
  return (
    <div className="flex flex-col w-full h-full justify-between items-center">
      <br />
      <div className="flex flex-col text-lg font-sans w-80 text-center halo-text">
        <span>Generate claimable tickets to send GHO</span>
        <span>No need to specify a wallet address</span>
        <span>As simple as using cash</span>
      </div>
      <div className="relative -top-3">
        <Triangle className="w-56 h-56 top-0 left-0 absolute halo-box" />
        <div className="w-56 h-56 relative">
          <Corner
            label="Send"
            route="send"
            className="absolute top-3 left-16"
          />
          <Corner
            label="Track"
            route="track"
            className="absolute -bottom-5 -left-10"
          />
          <Corner
            label="Claim"
            route="claim"
            className="absolute -bottom-5 -right-10"
          />
        </div>
      </div>
      <br />
    </div>
  )
}
