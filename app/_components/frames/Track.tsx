'use client'
//import { useEffect } from 'react'
import { cn } from '@utils/tw'
//import { useChainId } from 'wagmi'
//import load from '@contracts/loader'
//import { useTransact } from '@components/hooks/Transact'
import Title from '@components/elements/Title'
import { FaMagnifyingGlass, FaWandMagicSparkles } from 'react-icons/fa6'
//import { useParams } from 'react-router-dom'

export default function Track() {
  //const { addr } = useParams()
  //const { isConnected, address } = useAccount()
  //const chainId = useChainId()
  //const contract = load('QRFlow', chainId)
  //const [isLoading, setIsLoading] = useState(false)
  return (
    <>
      <Title
        label="Tracking"
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
      />
      <div
        className={cn(
          'flex flex-col h-full w-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl'
        )}
      >
        <div className="flex flex-col items-center justify-center w-full h-full mb-10">
          <FaWandMagicSparkles className="mb-4 text-6xl" />
          <span className="text-xl font-bold w-48 text-center">
            Not Ready Yet
          </span>
        </div>
      </div>
    </>
  )
}
