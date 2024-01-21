'use client'

import { useRef } from 'react'
import { useSnackbar } from '@layout/Snackbar'
import { useSignTypedData } from 'wagmi'
import { hexToSignature } from 'viem'

export function useSigner() {
  const addSnackbar = useSnackbar()
  const trigger = useRef<boolean>(false)
  const setTrigger = (value: boolean) => {
    trigger.current = value
  }
  const { signTypedData, data, isSuccess } = useSignTypedData({
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
        type: 'error',
        text: 'Failed to sign',
      })
    },
  })
  const signRequest = ({ ...args }: any) => {
    setTrigger(true)
    addSnackbar({
      type: 'info',
      text: 'Requesting signature...',
      duration: 0,
      trigger: trigger,
    })
    signTypedData({ ...args })
  }
  return { signRequest, signature: data, isSuccess, convert: hexToSignature }
}
