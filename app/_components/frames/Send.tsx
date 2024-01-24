'use client'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@utils/tw'
import { useModal } from 'connectkit'
import { useChainId, useAccount, useContractReads } from 'wagmi'
import load from '@contracts/loader'
import { generatePermitOrder, generatePermitGho } from '@utils/permits'
import { useSigner } from '@components/hooks/Signer'
import { useTransact } from '@components/hooks/Transact'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import {
  FaRegPaperPlane,
  FaArrowRightLong,
  FaCheck,
  FaCheckDouble,
  FaFileSignature,
  FaRegCircleCheck,
  FaRegCircleXmark,
} from 'react-icons/fa6'
import { Input, Switch } from '@nextui-org/react'
import { keccak256, toHex, encodePacked, Signature } from 'viem'
import { nanoid } from 'nanoid'

const inputClassNames = {
  base: 'p-0.5 rounded',
  label: '!text-white truncate text-sm font-mono',
  mainWrapper: 'h-9 w-full',
  inputWrapper:
    '!rounded !bg-gray-900 py-0 px-1 h-9 group-data-[focus=true]:!ring-1 group-data-[focus-visible=true]:!ring-1 !ring-amber-500',
  input: '!text-white !bg-gray-900 text-right no-arrow px-1',
  errorMessage: 'text-right',
}

const switchClassNames = {
  wrapper:
    'bg-gray-950 group-data-[selected=true]:bg-amber-700 ring-1 !ring-amber-500 ring-offset-2 ring-offset-gray-950',
  label: 'text-white ml-1 truncate',
}

const generateSecrets = (): `0x${string}`[] =>
  Array.from({ length: 11 }, () => keccak256(toHex(nanoid(32))))

export default function Send() {
  const secrets = useRef<`0x${string}`[]>(generateSecrets())
  const { setOpen, openSwitchNetworks } = useModal()
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const gho = load('Gho', chainId)
  const contract = load('GhoTicket', chainId)
  const [steps, setSteps] = useState({
    ready1: false,
    sign1: {} as Signature,
    ready2: false,
    sign2: {} as Signature,
    ready3: false,
    tx3: [] as any,
    results: [] as `0x${string}`[],
  })
  const signatureDeadline = useRef<bigint>(BigInt(0))
  const {
    signRequest,
    signature,
    isLoadingSign,
    isSuccessSign,
    isErrorSign,
    convert,
  } = useSigner()
  const { sendTx, isLoadingTx, isSuccessTx, isErrorTx, errorTx } = useTransact({
    chainId,
    contract,
    method: 'createOrder',
    args: steps.tx3,
  })
  const isLoading = isLoadingSign || isLoadingTx
  const { data: initReads } = useContractReads(
    isConnected
      ? {
          contracts: [
            {
              ...gho,
              functionName: 'balanceOf',
              args: [address!],
            },
            {
              ...gho,
              functionName: 'PERMIT_TYPEHASH',
            },
            {
              ...gho,
              functionName: 'nonces',
              args: [address!],
            },
            {
              ...contract,
              functionName: 'PERMIT_TICKET_TYPEHASH',
            },
            {
              ...contract,
              functionName: 'getAccountNonce',
              args: [address!],
            },
          ],
          watch: false,
        }
      : {}
  )
  let MAX: any,
    TYPEHASH_GHO: any,
    NONCE_GHO: any,
    TYPEHASH_GHOTICKET: any,
    NONCE_GHOTICKET: any
  if (initReads) {
    MAX = Number((initReads![0].result as bigint) / BigInt(10 ** 18))
    TYPEHASH_GHO = initReads![1].result as `0x${string}`
    NONCE_GHO = Number(initReads![2].result)
    TYPEHASH_GHOTICKET = initReads![3].result as `0x${string}`
    NONCE_GHOTICKET = Number(initReads![4].result)
  }
  const [hdm, setHdm] = useState({ hours: 0, days: 0, months: 0 })
  const [data, setData] = useState<{
    amount: number
    deadline: number
    stream: boolean
    nbTickets: number
    orderSecret: `0x${string}`
    ticketSecret: `0x${string}`[]
  }>({
    amount: 0,
    deadline: 0,
    stream: false,
    nbTickets: 0,
    orderSecret: secrets.current.at(0)!,
    ticketSecret: secrets.current.slice(1),
  })
  const handleData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name != 'stream' && e.target.value === '0') {
      setData({
        ...data,
        [e.target.name]: '',
      })
      return
    }
    if (e.target.name === 'amount') {
      const num = Number(e.target.value)
      e.target.value = (num > MAX ? MAX : num < 0 ? 0 : num).toString()
    } else if (e.target.name === 'nbTickets') {
      const num = Number(e.target.value)
      e.target.value = (num > 10 ? 10 : num < 1 ? 1 : num).toString()
    }
    setData({
      ...data,
      [e.target.name]:
        e.target.type === 'checkbox'
          ? e.target.checked
          : e.target.type === 'number'
            ? Number(e.target.value)
            : e.target.value,
    })
  }
  const handleDeadline = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    setHdm({
      ...hdm,
      [e.target.name]: value > 99 ? 99 : value < 1 ? 0 : value,
    })
  }
  useEffect(() => {
    if (isConnected)
      setData({
        ...data,
        ['deadline']:
          new Date().getTime() +
          hdm.hours * 3600000 +
          hdm.days * 86400000 +
          hdm.months * 2592000000,
      })
  }, [hdm])
  const autoSign = () => {
    if (steps.ready1 && !steps.ready2) {
      signRequest({
        ...generatePermitOrder({
          chainId: chainId,
          contactAddr: contract!.address,
          typehash: TYPEHASH_GHOTICKET,
          creator: address!,
          amount: BigInt(data.amount) * BigInt(10 ** 18),
          deadline: BigInt(Math.floor(data.deadline / 1000)),
          streamed: Number(data.stream),
          orderId: keccak256(
            encodePacked(
              ['address', 'uint256'],
              [address!, BigInt(NONCE_GHOTICKET)]
            )
          ),
          orderSecret: secrets.current.at(0)!,
        }),
      })
    } else if (steps.ready2 && !steps.ready3) {
      signatureDeadline.current = BigInt(
        Math.floor(new Date().getTime() / 1000 + 5 * 60)
      )
      signRequest({
        ...generatePermitGho({
          chainId: chainId,
          contactAddr: gho!.address,
          typehash: TYPEHASH_GHO,
          owner: address!,
          spender: contract!.address!,
          value: BigInt(data.amount) * BigInt(10 ** 18),
          nonce: BigInt(NONCE_GHO),
          deadline: signatureDeadline.current,
        }),
      })
    } else if (steps.ready3 && steps.results.length === 0) {
      setSteps({
        ...steps,
        tx3: [
          BigInt(data.amount) * BigInt(10 ** 18),
          BigInt(Math.floor(data.deadline / 1000)),
          Number(data.stream),
          secrets.current.slice(1),
          steps.sign2,
          signatureDeadline.current,
        ],
      })
    }
  }
  useEffect(() => {
    if (isConnected)
      setSteps({
        ...steps,
        ready1:
          data.amount > 0 &&
          data.amount <= MAX &&
          data.nbTickets > 0 &&
          data.nbTickets <= 10 &&
          hdm.months + hdm.days + hdm.hours > 0,
      })
  }, [data])
  useEffect(() => {
    if (isConnected && (isSuccessSign || isErrorSign)) {
      if (signature) {
        if (!steps.ready2)
          setSteps({
            ...steps,
            sign1: convert(signature),
            ready2: true,
          })
        else if (!steps.ready3)
          setSteps({
            ...steps,
            sign2: convert(signature),
            ready3: true,
          })
      }
    }
  }, [signature, isSuccessSign, isErrorSign])
  useEffect(() => {
    if (steps.results.length == 0) {
      if (steps.ready2 && !steps.ready3 && !isErrorSign) {
        setTimeout(() => {
          autoSign()
        }, 1000)
      } else if (steps.ready3 && steps.tx3.length === 0 && !isErrorTx) {
        setTimeout(() => {
          autoSign()
        }, 1000)
      } else if (
        steps.ready3 &&
        steps.tx3.length > 0 &&
        !isSuccessTx &&
        !isErrorTx
      ) {
        sendTx()
      } else if (isSuccessTx || isErrorTx) {
        if (isSuccessTx) {
          setSteps({
            ...steps,
            results: secrets.current.slice(1),
          })
        }
      }
    }
  }, [steps, isSuccessTx, isErrorTx])
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  useEffect(() => {
    if (!contract) openSwitchNetworks()
  }, [chainId])
  return (
    <>
      <Title
        label="Send Ticket[s]"
        logo={
          !isConnected ? (
            <FaRegPaperPlane className="rotate-12" />
          ) : !steps.ready2 ? (
            <FaCheck />
          ) : !steps.ready3 ? (
            <FaCheckDouble />
          ) : !isSuccessTx && !isErrorTx ? (
            <FaFileSignature className="ml-2" />
          ) : isSuccessTx ? (
            <FaRegCircleCheck className="text-green-500 text-xl" />
          ) : (
            <FaRegCircleXmark className="text-red-500 text-xl" />
          )
        }
        loading={isLoading}
        ready={steps.ready1 && !isLoading && !isSuccessTx && !isErrorTx}
        onClick={autoSign}
      />
      <div
        className={cn(
          'flex flex-col h-full border border-cyan-400 mt-2 items-center justify-start overflow-hidden',
          !isConnected || !contract ? 'w-full' : ''
        )}
      >
        {!isConnected ? (
          <PleaseConnect />
        ) : !contract ? (
          <WrongChain />
        ) : (
          <>
            <div
              className={cn(
                'flex flex-col w-full',
                steps.ready2 || isLoading
                  ? 'pointer-events-none cursor-not-allowed'
                  : ''
              )}
            >
              <div className="border-b-1 text-cyan-300 border-cyan-300 flex w-full items-center justify-between font-mono tracking-tighter text-xs">
                <div />
                <span
                  className={cn(
                    steps.ready1 && !steps.ready2
                      ? 'animate-pulse text-orange-400 font-bold'
                      : steps.ready2
                        ? 'text-green-400'
                        : ''
                  )}
                >
                  1. Sign Tickets
                </span>
                <FaArrowRightLong className="h-5 w-5 p-1" />
                <span
                  className={cn(
                    steps.ready2 && !steps.ready3
                      ? 'animate-pulse text-orange-400 font-bold'
                      : steps.ready3
                        ? 'text-green-400'
                        : ''
                  )}
                >
                  2. Sign Approval
                </span>
                <FaArrowRightLong className="h-5 w-5 p-1" />
                <span
                  className={cn(
                    steps.ready3 &&
                      steps.results.length === 0 &&
                      !isSuccessTx &&
                      !isErrorTx
                      ? 'animate-pulse text-orange-400 font-bold'
                      : isSuccessTx
                        ? 'text-green-400'
                        : isErrorTx
                          ? 'text-red-400'
                          : ''
                  )}
                >
                  3. Deposit $GHO
                </span>
                <div />
              </div>
              <div className="tracking-normal flex flex-wrap justify-between p-2 pb-2 border-b-1 border-cyan-800">
                <div className="p-0">
                  <div className="text-sm px-2 py-0 items-start w-64 flex flex-row">
                    <span className="text-sm font-mono">$GHO Amount</span>
                  </div>
                  <Input
                    isRequired
                    name="amount"
                    size="sm"
                    type="number"
                    min={0}
                    max={MAX}
                    placeholder="__"
                    value={data.amount ? data.amount.toString() : ''}
                    onChange={handleData}
                    classNames={inputClassNames}
                    startContent={
                      <button
                        className="text-xs text-amber-600 font-mono font-semibold tracking-widest cursor-pointer"
                        tabIndex={-1}
                        onClick={() => setData({ ...data, amount: MAX })}
                      >
                        MAX
                      </button>
                    }
                  />
                </div>
                <div className="p-0 w-16">
                  <div className="text-sm px-2 py-0 justify-center w-full flex flex-row">
                    <span className="text-sm font-mono">Tickets</span>
                  </div>
                  <Input
                    isRequired
                    name="nbTickets"
                    size="sm"
                    type="number"
                    min={0}
                    max={10}
                    placeholder="__"
                    value={data.nbTickets ? data.nbTickets.toString() : ''}
                    onChange={handleData}
                    classNames={inputClassNames}
                    startContent={
                      <button
                        className="text-xs text-amber-600 font-mono font-semibold tracking-widest cursor-pointer"
                        tabIndex={-1}
                        onClick={() => setData({ ...data, nbTickets: 10 })}
                      >
                        MAX
                      </button>
                    }
                  />
                </div>
                <div className="p-0">
                  <div className="text-sm px-2 py-0 items-center w-full flex flex-row">
                    <span className="text-sm font-mono">Deadline</span>
                    {hdm.hours + hdm.days + hdm.months > 0 &&
                      !(steps.ready2 || isLoading) && (
                        <span
                          className="ml-2 text-amber-600 cursor-pointer text-xs font-mono tracking-tighter ring-[0.5px] ring-amber-600 rounded-sm px-0.5"
                          onClick={() =>
                            setHdm({ hours: 0, days: 0, months: 0 })
                          }
                        >
                          reset↓
                        </span>
                      )}
                  </div>
                  <div className="flex flex-row w-64">
                    <Input
                      name="months"
                      size="sm"
                      type="number"
                      min={0}
                      max={99}
                      placeholder="__"
                      value={hdm.months ? hdm.months.toString() : ''}
                      onChange={handleDeadline}
                      classNames={inputClassNames}
                      startContent={
                        <span className="absolute top-0.5 left-1 text-xs font-mono text-gray-400 pointer-events-none">
                          Months
                        </span>
                      }
                    />
                    <Input
                      name="days"
                      size="sm"
                      type="number"
                      min={0}
                      max={99}
                      placeholder="__"
                      value={hdm.days ? hdm.days.toString() : ''}
                      onChange={handleDeadline}
                      classNames={inputClassNames}
                      startContent={
                        <span className="absolute top-0.5 left-1 text-xs font-mono text-gray-400 pointer-events-none">
                          Days
                        </span>
                      }
                    />
                    <Input
                      name="hours"
                      size="sm"
                      type="number"
                      min={0}
                      max={99}
                      placeholder="__"
                      value={hdm.hours ? hdm.hours.toString() : ''}
                      onChange={handleDeadline}
                      classNames={inputClassNames}
                      startContent={
                        <span className="absolute top-0.5 left-1 text-xs font-mono text-gray-400 pointer-events-none">
                          Hours
                        </span>
                      }
                    />
                  </div>
                  <div className="text-sm w-full flex justify-between pl-2 pr-1 items-center h-6 pt-1.5 text-gray-400 font-mono">
                    <div className="flex flex-row">
                      <span className="tracking-tighter">Ends on</span>
                      <FaArrowRightLong className="h-5 w-5 p-1 pt-[5px]" />
                    </div>
                    {data.deadline ? (
                      <span className="text-amber-500 font-bold tracking-wide">
                        {new Date(data.deadline).toLocaleString()}
                      </span>
                    ) : (
                      <span className="font-bold tracking-wide">
                        --/--/---- --:--:--
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-0 flex flex-col w-16 items-center justify-start">
                  <span className="text-sm pb-1 font-mono">Stream</span>
                  <Switch
                    size="sm"
                    name="stream"
                    checked={data.stream}
                    onChange={handleData}
                    classNames={switchClassNames}
                    className="pl-2 pt-1"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center justify-start h-full w-full text-xs break-words overflow-x-hidden">
              {!errorTx ? (
                steps.results.map((ticket, key) => (
                  <span key={key}>
                    {ticket.slice(0, 15) + '...' + ticket.slice(-15)}
                  </span>
                ))
              ) : (
                <div className="p-2 h-64 w-80 items-center justify-center text-xs break-words text-red-400">
                  ERROR: {errorTx.message}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
