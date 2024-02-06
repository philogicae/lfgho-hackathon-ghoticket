'use client'
import { useRef } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { useSignTypedData } from 'wagmi'
import { Hex, hexToSignature, verifyTypedData } from 'viem'

export function useSigner() {
  const id = useRef<number>(0)
  const dataToSign = useRef<any>({})
  const isValidSignature = useRef<boolean>(true)
  const addSnackbar = useSnackbar()
  const { trigger, wait, done } = useTrigger()
  const {
    signTypedDataAsync,
    data: signature,
    isPending,
    isSuccess,
    isError,
  } = useSignTypedData()
  const signRequest = ({ args, index }: { args: any; index?: number }) => {
    if (index) id.current = index
    dataToSign.current = args
    wait()
    addSnackbar({
      type: 'info',
      text: (id.current ? `${id.current}. ` : '') + 'Requesting signature...',
      duration: 0,
      trigger: trigger,
    })
    signTypedDataAsync({ ...dataToSign.current })
      .then(() => {
        if (trigger.current) {
          done()
          addSnackbar({
            type: 'success',
            text: (id.current ? `${id.current}. ` : '') + 'Signed successfully',
          })
        }
      })
      .catch(() => {
        if (trigger.current) {
          done()
          addSnackbar({
            type: 'warning',
            text: (id.current ? `${id.current}. ` : '') + 'Signature rejected',
          })
        }
      })
  }
  const toSignature = (hex: Hex) => {
    verifyTypedData({
      ...dataToSign.current,
      address: dataToSign.current.account,
      signature: hex,
    }).then((isValid) => {
      isValidSignature.current = isValid
      if (!isValid) {
        done()
        addSnackbar({
          type: 'error',
          text: (id.current ? `${id.current}. ` : '') + 'Signature invalid',
        })
      }
    })
    return hexToSignature(hex)
  }
  return {
    signRequest,
    signature,
    isLoadingSign: isPending,
    isSuccessSign: isSuccess && isValidSignature.current,
    isErrorSign: isError || !isValidSignature.current,
    convert: toSignature,
  }
}
