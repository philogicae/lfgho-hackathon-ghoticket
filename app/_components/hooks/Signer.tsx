'use client'
import { useRef } from 'react'
import { useSnackbar } from '@layout/Snackbar'
import { useSignTypedData } from 'wagmi'
import { Hex, hexToSignature, verifyTypedData } from 'viem'

export function useSigner() {
  const dataToSign = useRef<any>({})
  const isValidSignature = useRef<boolean>(true)
  const addSnackbar = useSnackbar()
  const trigger = useRef<boolean>(false)
  const setTrigger = (value: boolean) => {
    trigger.current = value
  }
  const {
    signTypedData,
    data: signature,
    isLoading,
    isSuccess,
    isError,
  } = useSignTypedData({
    onSuccess: () => {
      setTrigger(false)
      addSnackbar({
        type: 'success',
        text: 'Signed successfully',
      })
    },
    onError: () => {
      setTrigger(false)
      addSnackbar({
        type: 'warning',
        text: 'Failed to sign',
      })
    },
  })
  const signRequest = ({ ...args }: any) => {
    dataToSign.current = args
    setTrigger(true)
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
