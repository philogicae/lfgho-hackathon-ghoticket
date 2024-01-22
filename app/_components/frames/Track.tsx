'use client'
import { useEffect } from 'react'
import { useModal } from 'connectkit'
import { useChainId, useAccount } from 'wagmi'
import load from '@contracts/loader'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import { FaMagnifyingGlass } from 'react-icons/fa6'

export default function Track() {
  const chainId = useChainId()
  const { setOpen, openSwitchNetworks } = useModal()
  const { isConnected, address } = useAccount()
  const contract = load('GhoTicket', chainId)
  //const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  useEffect(() => {
    if (!contract) openSwitchNetworks()
  }, [chainId])
  return (
    <>
      <Title
        label="Tracking"
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
      />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 items-center justify-start">
        {!isConnected ? (
          <PleaseConnect />
        ) : !contract ? (
          <WrongChain />
        ) : (
          address
        )}
      </div>
    </>
  )
}
