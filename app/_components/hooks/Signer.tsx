'use client'
import { useRef } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { useSignTypedData } from 'wagmi'
import { Hex, hexToSignature, verifyTypedData } from 'viem'

export function useSigner() {
  const dataToSign = useRef<any>({})
  const isValidSignature = useRef<boolean>(true)
  const addSnackbar = useSnackbar()
  const { trigger, wait, done } = useTrigger()
  const {
    signTypedData,
    data: signature,
    isLoading,
    isSuccess,
    isError,
  } = useSignTypedData({
    onSuccess: () => {
      done()
      addSnackbar({
        type: 'success',
        text: 'Signed successfully',
      })
    },
    onError: () => {
      done()
      addSnackbar({
        type: 'warning',
        text: 'Signature rejected',
      })
    },
  })
  const signRequest = ({ ...args }: any) => {
    dataToSign.current = args
    wait()
    addSnackbar({
      type: 'info',
      text: 'Requesting signature...',
      duration: 0,
      trigger: trigger,
    })
    signTypedData({ ...dataToSign.current })
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
          text: 'Signature invalid',
        })
      }
    })
    return hexToSignature(hex)
  }
  return {
    signRequest,
    signature,
    isLoadingSign: isLoading,
    isSuccessSign: isSuccess && isValidSignature.current,
    isErrorSign: isError || !isValidSignature.current,
    convert: toSignature,
  }
}
