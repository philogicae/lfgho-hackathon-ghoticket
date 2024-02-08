'use client'
import { useEffect, useState } from 'react'
import { cn } from '@utils/tw'
import { useAccount } from 'wagmi'
import load, { ContractData } from '@contracts/loader'
import Title from '@components/elements/Title'
import { FaMagnifyingGlass, FaWandMagicSparkles } from 'react-icons/fa6'
//import { useParams } from 'react-router-dom'
import { useChains } from 'connectkit'
import { useCall } from '@components/hooks/Caller'

export default function Track() {
  //const { addr } = useParams()
  const { isConnected, address } = useAccount()
  const chains = useChains()
  const contracts = chains
    .map((c) => ({ chainId: c.id, contract: load('QRFlow', c.id) }))
    .filter((x) => !!x.contract) as {
    chainId: number
    contract: ContractData
  }[]
  const [contractData, setContractData] = useState<number[]>([])
  const { result: resultData } = useCall({
    calls: contracts.map((x) => ({
      ...x,
      functionName: 'getAccountNonce',
      args: [address!],
    })),
    initData: new Array(contracts.length).fill(BigInt(0)),
    active: isConnected && !contractData.length,
  })
  useEffect(() => {
    if (resultData) setContractData(resultData.getAccountNonce.map(Number))
  }, [resultData])
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    isLoading && setTimeout(() => setIsLoading(false), 2000)
  }, [isLoading])
  return (
    <>
      <Title
        label="Tracking"
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
        loading={isLoading}
        ready={true}
        onClick={() => setIsLoading(true)}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl bg-blue-800 bg-opacity-10'
        )}
      >
        <div className="border-b-1 text-cyan-300 border-cyan-300 flex w-full h-12 items-center justify-between font-mono tracking-tighter text-base">
          <div />
          WIP
          {/* <span className={cn('animate-pulse text-orange-400 font-bold')}>
            1. Sign Tickets
          </span>
          <span className={cn('animate-pulse text-orange-400 font-bold')}>
            2. Sign Approval
          </span>
          <span className={cn('animate-pulse text-orange-400 font-bold')}>
            3. Deposit $GHO
          </span> */}
          <div />
        </div>
        <div className="flex flex-col items-center justify-center w-full h-full mb-10">
          <FaWandMagicSparkles className="mb-4 text-6xl" />
          <span className="text-base font-bold w-48 text-center">
            {!!contractData.length
              ? JSON.stringify(
                  contractData.map((x, i) => ({
                    chain: contracts[i].chainId,
                    addr:
                      contracts[i].contract.address.slice(0, 4) +
                      '...' +
                      contracts[i].contract.address.slice(-4),
                    nonce: x,
                  })),
                  null,
                  2
                )
              : 'Not Ready Yet'}
          </span>
        </div>
      </div>
    </>
  )
}
