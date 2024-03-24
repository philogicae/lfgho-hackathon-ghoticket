'use client'
import { useEffect, useState } from 'react'
import { cn } from '@utils/tw'
import { useAccount, useEnsAddress } from 'wagmi'
import { Address, isAddress } from 'viem'
import { normalize } from 'viem/ens'
//import load, { ContractData } from '@contracts/loader'
import Title from '@components/elements/Title'
import {
  FaMagnifyingGlass,
  FaWandMagicSparkles,
  FaWallet,
  FaPaste,
  FaShareFromSquare,
  FaArrowsRotate,
} from 'react-icons/fa6'
import { useNavigate, useParams } from 'react-router-dom'
//import { useChains } from 'connectkit'
//import { useCall } from '@components/hooks/Caller'
import { Input } from '@nextui-org/react'
import Button from '@components/elements/Button'

const inputClassNames = {
  base: 'p-0',
  label: '!text-white truncate text-sm font-mono',
  mainWrapper: 'h-8 w-full',
  inputWrapper: '!rounded-md !bg-transparent !p-0 h-8 *:pb-0',
  input:
    '!text-white !bg-gray-950 text-left !text-[10px] no-arrow py-[2.5px] rounded group-data-[focus=true]:!ring-1 group-data-[focus-visible=true]:!ring-1 !ring-amber-500 mx-1.5 !text-center',
}

const isValidAddrOrENS = (input?: string) =>
  input &&
  ((input.length > 4 && input.endsWith('.eth')) ||
    (input.length === 42 && isAddress(input)))

export default function Track() {
  const navigate = useNavigate()
  const { wallet } = useParams()
  const [addr, setAddr] = useState<string | undefined>()
  const { data: dataEns, refetch: fetchEns } = useEnsAddress({
    chainId: 1,
    name: normalize(wallet!),
    query: {
      enabled: false,
    },
  })
  useEffect(() => {
    if (isValidAddrOrENS(wallet))
      wallet!.endsWith('.eth')
        ? fetchEns().then((x) => setAddr(x.data as Address))
        : setAddr(wallet)
  }, [wallet])
  const [tab, setTab] = useState(0)
  //const { isConnected, address } = useAccount()
  /* const chains = useChains()
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
  }, [resultData]) */
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    isLoading && setTimeout(() => setIsLoading(false), 2000)
  }, [isLoading])
  const test = 1
  return (
    <>
      <Title
        label="Tracking"
        loadingLabel={<span className="text-sm">REFRESHING</span>}
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
        loading={isLoading}
        ready={!isLoading}
        onClick={() => setIsLoading(true)}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl bg-blue-800 bg-opacity-10 w-full'
        )}
      >
        <div className="border-b-1 text-cyan-300 border-cyan-300 flex flex-col sm:flex-row w-full *:w-[330px] items-center justify-center font-mono tracking-tighter text-base bg-transparent pb-1.5 sm:pb-0">
          <div className="flex flex-row p-0 h-9 items-center justify-center">
            <Input
              name="wallet"
              size="sm"
              type="text"
              placeholder="Enter address or ENS"
              value={'0x0000000000000000000000000000000000000000'}
              maxLength={42}
              onChange={() => {}}
              classNames={inputClassNames}
              startContent={
                <button
                  className={cn(
                    'text-sm border-1 rounded p-0.5',
                    test
                      ? 'text-amber-500 border-amber-500 cursor-pointer hover:bg-gray-800'
                      : 'text-gray-600 border-gray-600 pointer-events-none'
                  )}
                  //onClick={() => address && navigate('/track/' + address)}
                >
                  <FaWallet className="w-5 h-5 px-0.5" />
                </button>
              }
              endContent={
                <button
                  className={cn(
                    'text-sm cursor-pointer border-1 rounded p-0.5 text-amber-500 border-amber-500 hover:bg-gray-800'
                  )}
                  onClick={() =>
                    navigator.clipboard
                      .readText()
                      .then(
                        (pasted) =>
                          isValidAddrOrENS(pasted) &&
                          navigate('/track/' + pasted)
                      )
                  }
                >
                  <FaPaste className="w-5 h-5 px-0.5" />
                </button>
              }
            />
          </div>
          <div className="flex flex-row p-0 h-6 sm:ml-1.5 w-full items-center justify-between">
            <button
              className={cn(
                'text-sm border-1 rounded p-0.5',
                test
                  ? 'text-cyan-300 border-cyan-300 cursor-pointer hover:bg-gray-800'
                  : 'text-gray-600 border-gray-600 pointer-events-none'
              )}
              onClick={() =>
                wallet &&
                navigator.share({
                  url: window.location.origin + `/#/track/${wallet}`,
                })
              }
            >
              <FaShareFromSquare className="w-5 h-5 px-0.5" />
            </button>
            <Button
              label="Orders"
              className={cn(
                'w-[131px] h-[25.5px] text-base  bg-gray-950 rounded border-1 border-cyan-300 hover:bg-gray-950',
                tab === 0
                  ? 'border-amber-500 text-amber-500 pointer-events-none font-bold'
                  : 'border-cyan-300 text-cyan-300 hover:bg-gray-800'
              )}
              onClick={() => {
                setTab(0)
              }}
            />
            <Button
              label="Tickets"
              className={cn(
                'w-[131px] h-[25.5px] text-base bg-gray-950 rounded border-1 border-cyan-300 hover:bg-gray-950',
                tab === 1
                  ? 'border-amber-500 text-amber-500 pointer-events-none font-bold'
                  : 'border-cyan-300 text-cyan-300 hover:bg-gray-800'
              )}
              onClick={() => {
                setTab(1)
              }}
            />
            <button
              className={cn(
                'text-sm border-1 rounded p-0.5',
                test
                  ? 'text-cyan-300 border-cyan-300 cursor-pointer hover:bg-gray-800'
                  : 'text-gray-600 border-gray-600 pointer-events-none'
              )}
              onClick={() => !isLoading && setIsLoading(true)}
            >
              <FaArrowsRotate className="w-5 h-5 px-0.5" />
            </button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-full h-full mb-10">
          <FaWandMagicSparkles className="mb-4 text-6xl" />
          <span className="text-base font-bold w-48 text-center">
            {/* {!!contractData.length
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
              : 'Not Ready Yet'} */}
            Not Ready Yet
          </span>
        </div>
      </div>
    </>
  )
}
