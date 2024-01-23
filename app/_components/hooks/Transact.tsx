'use client'
import { useEffect, useRef } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { ContractData } from '@contracts/loader'
import {
  usePrepareContractWrite,
  useContractWrite,
  useWaitForTransaction,
} from 'wagmi'
import { getBlockscan } from '@utils/chains'

type TransactProps = {
  chainId: number
  contract?: ContractData
  method: string
  args?: any
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
  const ready = useRef<boolean>(false)
  const {
    config,
    isError: isPrepareError,
    error: prepareError,
  } = usePrepareContractWrite({
    ...contract,
    functionName: method,
    args: args,
    enabled: ready.current,
    onError: () => {
      ready.current = false
      addSnackbar({ type: 'error', text: 'Transaction error' })
    },
  })
  const {
    writeAsync,
    data: tx,
    isLoading: isPreLoading,
    isSuccess: isPreSuccess,
    isError: isPreError,
    error: preError,
  } = useContractWrite(config)
  const {
    data: receipt,
    isLoading: isPostLoading,
    isSuccess: isPostSuccess,
    isError: isPostError,
    error: postError,
  } = useWaitForTransaction({
    hash: tx?.hash,
    onSuccess: () => {
      ready.current = false
      done()
      addSnackbar({
        type: 'success',
        text: 'Transaction confirmed',
      })
      onSuccess && onSuccess()
    },
    onError: () => {
      ready.current = false
      done()
      addSnackbar({
        type: 'error',
        text: 'Transaction failed',
      })
      onError && onError()
    },
  })
  useEffect(() => {
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
  }, [tx])
  return {
    sendTx: () => {
      ready.current = true
      writeAsync?.().catch(() => {
        ready.current = false
        addSnackbar({ type: 'error', text: 'Transaction error' })
        onError && onError()
      })
    },
    tx: receipt ?? tx,
    isLoadingTx: isPreLoading || isPostLoading,
    isSuccessTx: isPostSuccess || isPreSuccess,
    isErrorTx: isPrepareError || isPostError || isPreError,
    errorTx: prepareError || preError || postError,
  }
}

export type { TransactProps }
export { useTransact }
