'use client'

import { useEffect, useState } from 'react'
import { useModal } from 'connectkit'
import { useChainId, useAccount, useContractRead } from 'wagmi'
import load from '@contracts/loader'
import { useTransact } from '@components/hooks/Transact'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import { FaRegMoneyBill1 } from 'react-icons/fa6'
import { hexToSignature } from 'viem'

export default function Claim() {
  const chainId = useChainId()
  const { setOpen, openSwitchNetworks } = useModal()
  const { isConnected, address } = useAccount()
  const contract = load('GhoTicket', chainId)
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  useEffect(() => {
    if (!contract) openSwitchNetworks()
  }, [chainId])
  return (
    <>
      <Title
        label="Claim Ticket"
        logo={<FaRegMoneyBill1 className="text-3xl" />}
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
