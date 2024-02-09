'use client'
import { ReactNode } from 'react'
import { ClassName, cn } from '@utils/tw'
import { useNavigate } from 'react-router-dom'
import Button from '@components/elements/Button'
import {
  FaArrowTurnDown,
  FaArrowDownLong,
  FaArrowRightArrowLeft,
  FaFileInvoiceDollar,
  FaXmark,
  FaHandHoldingDollar,
} from 'react-icons/fa6'
import { useAccount } from 'wagmi'

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
  icon,
  position,
  className,
}: {
  label: string
  route: string
  icon?: ReactNode
  position?: string
  className?: ClassName
}) => {
  const navigate = useNavigate()
  return (
    <div className={cn('flex flex-col items-center justify-center', className)}>
      {position === 'top' && icon}
      <Button
        label={label}
        className={cn(
          'bg-sky-950 hover:bg-cyan-300 hover:text-black hover:font-bold active:bg-cyan-300 active:text-black active:font-bold w-24 halo-button'
        )}
        onClick={() => navigate(route)}
      />
      {position === 'bottom' && icon}
    </div>
  )
}

export default function Welcome() {
  const { address } = useAccount()
  const arrowStyle = 'animate-pulse text-2xl text-cyan-400'
  return (
    <div className="flex flex-col w-full h-full justify-between items-center overflow-hidden">
      <div className="flex flex-col text-base font-sans w-96 h-1/3 items-center justify-center halo-text">
        <div className="flex flex-row items-center justify-center">
          <FaFileInvoiceDollar className="pr-3 text-2xl" />
          <span>Create claimable tickets to send ERC20 tokens</span>
          <FaFileInvoiceDollar className="pl-3 text-2xl" />
        </div>
        <div className="flex flex-row items-center justify-center">
          <FaXmark className="pr-2 pt-0.5 text-2xl" />
          <span> No need to specify any wallet address </span>
          <FaXmark className="pl-2 pt-0.5 text-2xl" />
        </div>
        <div className="flex flex-row items-center justify-center">
          <FaHandHoldingDollar className="pl-3 pt-0.5 text-3xl transform -scale-x-100" />
          <span>Simple as using cash</span>
          <FaHandHoldingDollar className="pl-3 pt-0.5 text-3xl" />
        </div>
        <div className="flex flex-row items-center justify-center pt-1 animate-pulse text-cyan-200 font-mono font-thin">
          <FaArrowTurnDown className="pl-0 pt-3 text-3xl transform -scale-x-100" />
          <span className="font-mono">START NOW</span>
          <FaArrowTurnDown className="pl-0 pt-3 text-3xl" />
        </div>
      </div>
      <div className="relative h-2/3">
        <Triangle className="w-56 h-56 top-0 left-0 absolute halo-box" />
        <div className="w-56 h-56 relative">
          <Corner
            label="Send"
            route="send"
            position="top"
            icon={
              <FaArrowDownLong
                className={cn(arrowStyle, 'pb-0.5 text-cyan-200')}
              />
            }
            className="absolute -top-4 left-16"
          />
          <Corner
            label="Track"
            route={'track' + (address ? `/${address}` : '')}
            position="bottom"
            icon={
              <FaArrowRightArrowLeft
                className={cn(arrowStyle, 'pt-0.5 rotate-90 text-cyan-200')}
              />
            }
            className="absolute -bottom-10 -left-12"
          />
          <Corner
            label="Claim"
            route="claim"
            position="bottom"
            icon={
              <FaArrowDownLong
                className={cn(arrowStyle, 'pt-0.5 text-cyan-200')}
              />
            }
            className="absolute -bottom-10 -right-12"
          />
        </div>
      </div>
    </div>
  )
}
