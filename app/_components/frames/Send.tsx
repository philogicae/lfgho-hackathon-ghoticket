'use client'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@utils/tw'
import { useModal } from 'connectkit'
import { useChainId, useAccount, useContractReads } from 'wagmi'
import load from '@contracts/loader'
import { generateTicketPermit, generateGhoPermit } from '@utils/permits'
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
} from 'react-icons/fa6'
import { Input, Switch } from '@nextui-org/react'
import { keccak256, toHex, encodePacked, Hex, Signature } from 'viem'
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
const PRECISION = 8
const floatRegex = new RegExp(`^([0-9]+[.]?[0-9]{0,${PRECISION}})?$`)
const generateHex = (): Hex => keccak256(toHex(nanoid(32)))
const generateBatchHex = (): Hex[] => Array.from({ length: 10 }, generateHex)
const generateTicketIds = (orderSecret: Hex, ticketSecrets: Hex[]): Hex[] =>
  ticketSecrets.map((ticketSecret) =>
    keccak256(encodePacked(['bytes32', 'bytes32'], [orderSecret, ticketSecret]))
  )

export default function Send() {
  const { isConnected, address } = useAccount()
  const { setOpen, openSwitchNetworks } = useModal()
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
    executed: false,
  })
  const orderSecret = useRef<Hex>(generateHex())
  const ticketSecrets = useRef<Hex[]>(generateBatchHex())
  const bigAmount = useRef<bigint>(BigInt(0))
  const signatureDeadline = useRef<bigint>(BigInt(0))
  const { signRequest, signature, isLoadingSign, isErrorSign, convert } =
    useSigner()
  const { sendTx, isReadyTx, isLoadingTx, isSuccessTx, isErrorTx } =
    useTransact({
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
              functionName: 'decimals',
            },
            {
              ...gho,
              functionName: 'balanceOf',
              args: [address!],
            },
            {
              ...gho,
              functionName: 'nonces',
              args: [address!],
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
  let DECIMALS: number, MAX: any, NONCE_GHO: bigint, NONCE_GHOTICKET: bigint
  if (initReads) {
    DECIMALS = initReads![0].result as number
    MAX =
      Number(
        (initReads![1].result as bigint) / BigInt(10 ** (DECIMALS - PRECISION))
      ) /
      10 ** PRECISION
    NONCE_GHO = initReads![2].result as bigint
    NONCE_GHOTICKET = initReads![3].result as bigint
  }
  const [hdm, setHdm] = useState({ hours: 0, days: 0, months: 0 })
  const [data, setData] = useState<{
    amount: any
    deadline: number
    stream: boolean
    nbTickets: number
    orderSecret: Hex
    ticketIds: Hex[]
  }>({
    amount: '',
    deadline: 0,
    stream: false,
    nbTickets: 0,
    orderSecret: orderSecret.current,
    ticketIds: generateTicketIds(orderSecret.current, ticketSecrets.current),
  })
  const restrict = (n: any, min: number, max: number) =>
    Number(n) > max ? max : Number(n) < min ? min : n
  const handleData = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (e.target.name === 'amount') {
      value = value.replace(',', '.')
      value = floatRegex.test(value) ? restrict(value, 0, MAX) : data.amount
    } else if (e.target.name === 'nbTickets') {
      value = restrict(Math.round(Number(value)), 0, 10)
    }
    setData({
      ...data,
      [e.target.name]: e.target.name === 'stream' ? e.target.checked : value,
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
  const submit = () => {
    if (steps.ready1 && !steps.ready2) {
      const tempAmount =
        BigInt(Number(data.amount * 10 ** PRECISION)) *
        BigInt(10 ** (DECIMALS - PRECISION))
      bigAmount.current = tempAmount - (tempAmount % BigInt(data.nbTickets))
      signRequest({
        ...generateTicketPermit({
          chainId: chainId,
          contactAddr: contract!.address,
          creator: address!,
          orderId: keccak256(
            encodePacked(['address', 'uint256'], [address!, NONCE_GHOTICKET])
          ),
          orderSecret: data.orderSecret,
        }),
      })
    } else if (steps.ready2 && !steps.ready3) {
      signatureDeadline.current = BigInt(
        Math.floor(new Date().getTime() / 1000 + 5 * 60)
      )
      signRequest({
        ...generateGhoPermit({
          chainId: chainId,
          contactAddr: gho!.address,
          owner: address!,
          spender: contract!.address!,
          value: bigAmount.current,
          nonce: NONCE_GHO,
          deadline: signatureDeadline.current,
        }),
      })
    } else if (steps.ready3 && !isReadyTx) {
      setSteps({
        ...steps,
        tx3: [
          bigAmount.current,
          BigInt(Math.floor(data.deadline / 1000)),
          Number(data.stream),
          data.ticketIds.slice(0, data.nbTickets),
          steps.sign2,
          signatureDeadline.current,
        ],
      })
    } else if (steps.ready3 && isReadyTx && !steps.executed) {
      sendTx()
    }
  }
  useEffect(() => {
    if (isConnected)
      setSteps({
        ...steps,
        ready1:
          Number(data.amount) > 0 &&
          Number(data.amount) <= MAX &&
          data.nbTickets > 0 &&
          data.nbTickets <= 10 &&
          hdm.months + hdm.days + hdm.hours > 0,
      })
  }, [data])
  useEffect(() => {
    if (isConnected && signature) {
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
  }, [signature])
  useEffect(() => {
    if (isConnected && !steps.executed) {
      if (!isSuccessTx) {
        if (steps.ready2 && !steps.ready3 && !isLoadingSign && !isErrorSign) {
          submit()
        } else if (steps.ready3 && !isReadyTx) {
          submit()
        } else if (steps.ready3 && isReadyTx && !isLoadingTx && !isErrorTx) {
          submit()
        }
      } else {
        setSteps({
          ...steps,
          executed: true,
        })
      }
    }
  }, [steps, isReadyTx, isSuccessTx, isErrorTx])
  useEffect(() => {
    if (isConnected && !contract) openSwitchNetworks()
  }, [isConnected && chainId])
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
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
          ) : !isSuccessTx ? (
            <FaFileSignature className="ml-2" />
          ) : (
            <FaRegCircleCheck className="text-green-500 text-xl" />
          )
        }
        loading={isLoading}
        ready={steps.ready1 && !isLoading && !isSuccessTx}
        onClick={submit}
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
                    steps.ready3 && !steps.executed
                      ? 'animate-pulse text-orange-400 font-bold'
                      : steps.executed
                        ? 'text-green-400'
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
                    <span className="text-sm font-mono">Total Amount $GHO</span>
                  </div>
                  <Input
                    isRequired
                    name="amount"
                    size="sm"
                    type="text"
                    placeholder="__"
                    inputMode="decimal"
                    value={data.amount}
                    onChange={handleData}
                    classNames={inputClassNames}
                    startContent={
                      <button
                        className="text-xs text-amber-600 font-mono font-semibold tracking-widest cursor-pointer"
                        tabIndex={-1}
                        onClick={() =>
                          setData({ ...data, amount: MAX.toString() })
                        }
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
            <div className="flex flex-col items-center justify-center h-full w-full text-sm font-mono break-words overflow-x-hidden">
              {steps.executed &&
                data.ticketIds.map((ticketId, key) => (
                  <span key={key}>
                    {key +
                      1 +
                      ': ' +
                      ticketId.slice(0, 15) +
                      '...' +
                      ticketId.slice(-15)}
                  </span>
                ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
