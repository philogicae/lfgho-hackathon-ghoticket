'use client'

import { useEffect, useState } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { useModal } from 'connectkit'
import { useChainId, useAccount, useContractRead } from 'wagmi'
import load from '@contracts/loader'
import { useTransact } from '@components/hooks/Transact'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import Button from '@components/elements/Button'
import { FaRegPaperPlane } from 'react-icons/fa6'

export default function Send() {
  const chainId = useChainId()
  const addSnackbar = useSnackbar()
  const { setOpen, openSwitchNetworks } = useModal()
  const { isConnected, address } = useAccount()
  const contract = load('ATM', chainId)
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  useEffect(() => {
    if (!contract) openSwitchNetworks()
  }, [chainId])
  return (
    <>
      <Title label="Send Ticket[s]" logo={<FaRegPaperPlane />} />
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
