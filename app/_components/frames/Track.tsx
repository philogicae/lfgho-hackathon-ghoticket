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

const inputClassNames = {
  base: 'p-0 w-[335px]',
  label: '!text-white truncate text-sm font-mono',
  mainWrapper: 'h-9 w-full',
  inputWrapper:
    '!rounded-lg !bg-gray-900 py-0 px-1.5 h-9 group-data-[focus=true]:!ring-1 group-data-[focus-visible=true]:!ring-1 !ring-amber-500 *:pb-0',
  input: '!text-white !bg-black text-left !text-[10px] no-arrow px-1 rounded',
}

const isValidAddrOrENS = (input?: string) =>
  input &&
  ((input.length > 4 && input.endsWith('.eth')) ||
    (input.length === 42 && isAddress(input)))

export default function Track() {
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

  const navigate = useNavigate()
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
  return (
    <>
      <Title
        label="Tracking"
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
        <div className="border-b-1 text-cyan-300 border-cyan-300 flex flex-row w-full h-14 items-center justify-center font-mono tracking-tighter text-base bg-black">
          <div className="flex flex-row p-0 items-center justify-center">
            <Input
              name="amount"
              size="sm"
              type="text"
              placeholder="Enter address or ENS"
              //value={wallet}
              maxLength={42}
              onChange={() => {}}
              classNames={inputClassNames}
              startContent={
                <button
                  className={cn(
                    'text-sm cursor-pointer border-1 rounded p-0.5 mr-1.5',
                    false
                      ? 'text-amber-500 border-amber-500 '
                      : 'text-gray-500 border-gray-500 '
                  )}
                  //onClick={() => address && navigate('/track/' + address)}
                >
                  <FaWallet className="w-4 h-4 px-0.5" />
                </button>
              }
              endContent={
                <>
                  <button
                    className="text-sm cursor-pointer text-amber-500 border-1 border-amber-500 rounded ml-1.5 p-0.5"
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
                    <FaPaste className="w-4 h-4 px-0.5" />
                  </button>
                  <button
                    className="text-sm cursor-pointer text-amber-500 ml-1 border-1 border-amber-500 rounded p-0.5"
                    onClick={() =>
                      wallet &&
                      navigator.share({
                        url: window.location.origin + `/#/track/${wallet}`,
                      })
                    }
                  >
                    <FaShareFromSquare className="w-4 h-4 px-0.5" />
                  </button>
                </>
              }
            />
            <button
              className={cn(
                'text-sm cursor-pointer border-1 rounded p-0.5 ml-1.5',
                true
                  ? 'text-cyan-300 border-cyan-300 '
                  : 'text-gray-500 border-gray-500 '
              )}
              onClick={() => setIsLoading(true)}
            >
              <FaArrowsRotate
                className={cn(
                  'w-4 h-4 px-0.5',
                  isLoading ? 'animate-spin' : ''
                )}
              />
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
