'use client'
import { useEffect, useRef } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { ContractData } from '@contracts/loader'
import {
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { txType } from '@layout/ConnectKit'
import { useChains } from 'connectkit'

type TransactProps = {
  chainId: number
  contract?: ContractData
  method: string
  args: any[]
  enabled: boolean
  ignoreError?: boolean
  onSuccess?: () => void
  onError?: () => void
}

const useTransact = ({
  chainId,
  contract,
  method,
  args = [],
  enabled = false,
  ignoreError = true,
  onSuccess,
  onError,
}: TransactProps) => {
  const chains = useChains()
  const blockExplorer = chains.find((chain) => chain.id === chainId)
    ?.blockExplorers?.default.url
  const id = useRef<number>(0)
  const executed = useRef<boolean>(false)
  const addSnackbar = useSnackbar()
  const { trigger: preTrigger, wait: preWait, done: preDone } = useTrigger()
  const { trigger, wait, done } = useTrigger()
  const {
    data,
    isSuccess: isPrepareSuccess,
    isError: isPrepareError,
  } = useSimulateContract({
    chainId,
    ...contract,
    functionName: method,
    args: args,
    type: txType[chainId],
    query: {
      enabled: enabled && !executed.current,
    },
  })
  const {
    writeContractAsync,
    data: txHash,
    isPending: isPreLoading,
    isSuccess: isPreSuccess,
    isError: isPreError,
    error: preError,
  } = useWriteContract()
  const {
    data: txReceipt,
    isLoading: isPostLoading,
    isSuccess: isPostSuccess,
    isError: isPostError,
    error: postError,
  } = useWaitForTransactionReceipt({
    chainId,
    hash: txHash,
    confirmations: 1,
    query: { enabled: Boolean(txHash) },
  })
  useEffect(() => {
    if (isPrepareError) {
      if (!ignoreError)
        addSnackbar({
          type: 'error',
          text: (id.current ? `${id.current}. ` : '') + 'Tx error',
        })
      onError && onError()
    }
  }, [isPrepareError])
  useEffect(() => {
    if (txHash) {
      preDone()
      wait()
      addSnackbar({
        type: 'info',
        text: (id.current ? `${id.current}. ` : '') + 'Tx submitted',
        link: blockExplorer + '/tx/' + txHash,
        chrono: true,
        trigger: trigger,
      })
    }
  }, [txHash])
  useEffect(() => {
    if (isPostSuccess) {
      if (!executed.current) {
        executed.current = true
        done()
        addSnackbar({
          type: 'success',
          text: (id.current ? `${id.current}. ` : '') + 'Tx confirmed',
        })
        onSuccess && onSuccess()
      }
    } else if (isPostError) {
      done()
      addSnackbar({
        type: 'error',
        text: (id.current ? `${id.current}. ` : '') + 'Tx failed',
      })
      onError && onError()
    }
  }, [isPostSuccess, isPostError])
  return {
    sendTx: ({ index }: { index?: number }) => {
      if (isPrepareSuccess) {
        if (index) id.current = index
        preWait()
        addSnackbar({
          type: 'info',
          text: (id.current ? `${id.current}. ` : '') + 'Tx signing...',
          duration: 0,
          trigger: preTrigger,
        })
        writeContractAsync(data!.request).catch(() => {
          preDone()
          addSnackbar({
            type: 'warning',
            text: (id.current ? `${id.current}. ` : '') + 'Tx rejected',
          })
          onError && onError()
        })
      }
    },
    receipt: txReceipt,
    isReadyTx: isPrepareSuccess,
    isLoadingTx: isPreLoading || isPostLoading,
    isSuccessTx: isPreSuccess && isPostSuccess,
    isErrorTx: isPreError || isPostError,
    errorTx: preError || postError,
  }
}

export type { TransactProps }
export { useTransact }
