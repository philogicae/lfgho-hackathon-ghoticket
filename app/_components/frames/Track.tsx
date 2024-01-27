'use client'
import { useEffect } from 'react'
import { cn } from '@utils/tw'
import { useModal } from 'connectkit'
import { useChainId, useAccount, useContractRead } from 'wagmi'
import load from '@contracts/loader'
import { useTransact } from '@components/hooks/Transact'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import { FaMagnifyingGlass, FaWandMagicSparkles } from 'react-icons/fa6'
import { useParams } from 'react-router-dom'

export default function Track() {
  const { data } = useParams()
  const { isConnected, address } = useAccount()
  const { setOpen, openSwitchNetworks } = useModal()
  const chainId = useChainId()
  const contract = load('GhoTicket', chainId)
  //const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (isConnected && !contract) openSwitchNetworks()
  }, [isConnected && chainId])
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  return (
    <>
      <Title
        label="Tracking"
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[360px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl',
          !isConnected || !contract ? 'w-full' : ''
        )}
      >
        {!isConnected ? (
          <PleaseConnect />
        ) : !contract ? (
          <WrongChain />
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <FaWandMagicSparkles className="text-6xl" />
            <span className="m-3 text-3xl font-bold text-center">
              Not ready yet
            </span>
          </div>
        )}
      </div>
    </>
  )
}
