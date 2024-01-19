'use client'
import { useEffect } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { ContractData } from '@contracts/loader'
import { useContractWrite, useWaitForTransaction } from 'wagmi'
import { getBlockscan } from '@utils/chains'

type TransactProps = {
  chainId: number
  contract?: ContractData
  method: string
  args?: unknown
  onSuccess?: () => void
  onError?: () => void
}

const useTransact = ({
  chainId,
  contract,
  method,
  args,
  onSuccess,
  onError,
}: TransactProps) => {
  const addSnackbar = useSnackbar()
  const { trigger, wait, done } = useTrigger()
  const {
    writeAsync,
    isLoading,
    data: tx,
  } = useContractWrite({
    ...contract,
    functionName: method,
  })
  useWaitForTransaction({
    hash: tx?.hash,
    onSuccess: () => {
      done()
      addSnackbar({
        type: 'success',
        text: 'Transaction confirmed',
      })
      onSuccess && onSuccess()
    },
    onError: () => {
      done()
      addSnackbar({
        type: 'error',
        text: 'Transaction failed',
      })
      onError && onError()
    },
  })
  useEffect(
    () => {
      if (tx?.hash) {
        wait()
        addSnackbar({
          type: 'info',
          text: 'Transaction submitted',
          link: getBlockscan[chainId] + tx!.hash,
          duration: 0,
          trigger: trigger,
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tx]
  )
  return {
    send: () =>
      writeAsync({ args: args }).catch(() => {
        addSnackbar({ type: 'error', text: 'Transaction error' })
        onError && onError()
      }),
    transactLoading: isLoading,
  }
}

export type { TransactProps }
export { useTransact }
