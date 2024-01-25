'use client'
import { useEffect } from 'react'
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
  const {
    config,
    isSuccess: isPrepareSuccess,
    isError: isPrepareError,
    error: prepareError,
  } = usePrepareContractWrite({
    ...contract,
    functionName: method,
    args: args,
    enabled: args.length > 0,
    onError: () => {
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
      writeAsync!().catch(() => {
        addSnackbar({ type: 'error', text: 'Transaction error' })
        onError && onError()
      })
    },
    tx: receipt ?? tx,
    isReadyTx: isPrepareSuccess,
    isLoadingTx: isPreLoading || isPostLoading,
    isSuccessTx: isPreSuccess && isPostSuccess,
    isErrorTx: isPreError || isPostError,
    errorTx: preError || postError,
  }
}

export type { TransactProps }
export { useTransact }
