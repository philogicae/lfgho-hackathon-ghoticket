'use client'

import { useEffect, useState } from 'react'
import Button from '@components/elements/Button'
import Title from '@components/elements/Title'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { FaRegPaperPlane } from 'react-icons/fa6'
import load from '@contracts/loader'
import { useAccount, useChainId, useContractRead } from 'wagmi'
import { toChainName } from '@utils/chains'
import { useTransact } from '@components/hooks/Transact'
import { useModal } from 'connectkit'

export default function Send() {
  const addSnackbar = useSnackbar()
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
      <Title label="Send Ticket[s]" logo={<FaRegPaperPlane />} />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 items-center justify-between">
        <br />
        <Button
          label="Test error"
          onClick={() =>
            addSnackbar({
              type: 'error',
              text: 'Transaction failed',
            })
          }
        />
        <Button
          label="Test info"
          onClick={() =>
            addSnackbar({
              type: 'info',
              text: 'Transaction submitted',
              link: 'https://google.com',
            })
          }
        />
        <Button
          label="Test warning"
          onClick={() =>
            addSnackbar({
              type: 'warning',
              text: 'Transaction may fail',
            })
          }
        />
        <br />
      </div>
    </>
  )
}
