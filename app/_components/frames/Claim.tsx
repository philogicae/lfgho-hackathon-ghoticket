'use client'

import { useEffect, useState } from 'react'
import Title from '@components/elements/Title'
import { FaRegMoneyBill1 } from 'react-icons/fa6'
import { useModal } from 'connectkit'
import { useAccount, useChainId, useContractRead } from 'wagmi'
//import load from '@contracts/loader'
import { toChainName } from '@utils/chains'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { useTransact } from '@components/hooks/Transact'

export default function Claim() {
  const { setOpen } = useModal()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  //const contract = load('ATM', chainId)
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  return (
    <>
      <Title
        label="Claim Ticket"
        logo={<FaRegMoneyBill1 className="text-3xl" />}
      />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 "></div>
    </>
  )
}
