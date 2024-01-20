'use client'

import { useEffect, useState } from 'react'
import Title from '@components/elements/Title'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
//import load from '@contracts/loader'
import { useAccount, useChainId, useContractRead } from 'wagmi'
import { toChainName } from '@utils/chains'
import { useTransact } from '@components/hooks/Transact'

export default function Track() {
  const addSnackbar = useSnackbar()
  const { isConnected } = useAccount()
  const chainId = useChainId()
  //const contract = load('ATM', chainId)
  const [isLoading, setIsLoading] = useState(false)
  return (
    <>
      <Title
        label="Tracking"
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
      />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 "></div>
    </>
  )
}
