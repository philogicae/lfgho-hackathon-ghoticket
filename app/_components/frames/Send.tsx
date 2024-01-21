'use client'

import { useEffect, useState } from 'react'
import { useSnackbar, useTrigger } from '@layout/Snackbar'
import { useModal } from 'connectkit'
import {
  useChainId,
  useAccount,
  useContractRead,
  useContractReads,
} from 'wagmi'
import load from '@contracts/loader'
import { useSigner } from '@components/hooks/Signer'
import { useTransact } from '@components/hooks/Transact'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import Button from '@components/elements/Button'
import {
  FaRegPaperPlane,
  FaArrowRightLong,
  FaCheck,
  FaCheckDouble,
  FaRegCircleCheck,
} from 'react-icons/fa6'
import { Input, Switch } from '@nextui-org/react'
import {
  keccak256,
  toHex,
  /* encodeAbiParameters,
  parseAbiParameters, */
  encodePacked,
  TypedData,
  Signature,
} from 'viem'
import { nanoid } from 'nanoid'
import { cn } from '@utils/tw'

const textClassNames = {
  base: 'p-0.5 rounded',
  label: '!text-white truncate text-sm font-mono',
  mainWrapper: 'h-9 w-full',
  inputWrapper: '!rounded !bg-gray-900 py-0 px-1 h-9',
  input: '!text-white !bg-gray-900 text-right no-arrow px-1',
  errorMessage: 'text-right',
}

const switchClassNames = {
  wrapper:
    'bg-gray-950 group-data-[selected=true]:bg-cyan-800 ring-1 ring-cyan-400 ring-offset-2 ring-offset-gray-950',
  label: 'text-white ml-1 truncate',
}

const generateSecrets = (): `0x${string}`[] =>
  Array.from({ length: 11 }, () => keccak256(toHex(nanoid(32))))

type Data = {
  amount: number
  deadline: number
  stream: boolean
  nbTickets: number
  orderSecret: `0x${string}`
  ticketSecret: `0x${string}`[]
}

type Sign1 = {
  chainId: number
  contactAddr: `0x${string}`
  typehash: `0x${string}`
  address: `0x${string}`
  amount: bigint
  orderId: `0x${string}`
  orderSecret: `0x${string}`
}
const generateSign1 = ({
  chainId,
  contactAddr,
  typehash,
  address,
  amount,
  orderId,
  orderSecret,
}: Sign1): any => {
  return {
    account: address,
    domain: {
      name: 'GhoTicket',
      version: 'alpha',
      chainId: chainId,
      verifyingContract: contactAddr,
    },
    primaryType: 'SignOrder',
    types: {
      SignOrder: [
        { name: 'typehash', type: 'bytes32' },
        { name: 'address', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'orderId', type: 'bytes32' },
        { name: 'orderSecret', type: 'bytes32' },
      ],
    } as const satisfies TypedData,
    message: {
      typehash: typehash,
      address: address,
      amount: amount,
      orderId: orderId,
      orderSecret: orderSecret,
    },
  }
}

type Sign2 = {
  chainId: number
  contactAddr: `0x${string}`
  typehash: `0x${string}`
  owner: `0x${string}`
  spender: `0x${string}`
  value: bigint
  nonce: bigint
  deadline: bigint
}
const generateSign2 = ({
  chainId,
  contactAddr,
  typehash,
  owner,
  spender,
  value,
  nonce,
  deadline,
}: Sign2): any => {
  return {
    account: owner,
    domain: {
      name: 'Gho Token',
      version: '1',
      chainId: chainId,
      verifyingContract: contactAddr,
    },
    primaryType: 'SignOrder',
    types: {
      SignOrder: [
        { name: 'typehash', type: 'bytes32' },
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const satisfies TypedData,
    message: {
      typehash: typehash,
      owner: owner,
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline,
    },
  }
}

export default function Send() {
  const chainId = useChainId()
  const addSnackbar = useSnackbar()
  const { setOpen, openSwitchNetworks } = useModal()
  const { isConnected, address } = useAccount()
  const { signRequest, signature, convert } = useSigner()
  const contract = load('GhoTicket', chainId)
  const gho = load('Gho', chainId)
  const [steps, setSteps] = useState({
    ready1: false,
    sign1: '' as any,
    ready2: false,
    sign2: '' as any,
    ready3: false,
    tx3: '' as any,
    tickets: [] as `0x${string}`[],
  })
  const [isLoading, setIsLoading] = useState(false)
  const [secrets, setSecrets] = useState(generateSecrets())
  const [data, setData] = useState<Data>({
    amount: 0,
    deadline: 3600000,
    stream: false,
    nbTickets: 1,
    orderSecret: secrets.at(0) as `0x${string}`,
    ticketSecret: secrets.slice(1) as `0x${string}`[],
  })
  const [hdm, setHdm] = useState({ hours: 1, days: 0, months: 0 })
  const { data: initReads } = useContractReads({
    contracts: [
      {
        ...gho,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      },
      {
        ...gho,
        functionName: 'PERMIT_TYPEHASH',
      },
      {
        ...gho,
        functionName: 'nonces',
        args: [address as `0x${string}`],
      },
      {
        ...contract,
        functionName: 'PERMIT_TICKET_TYPEHASH',
      },
      {
        ...contract,
        functionName: 'getAccountNonce',
        args: [address as `0x${string}`],
      },
    ],
  })
  const BALANCE = (initReads?.[0].result as bigint) ?? BigInt(0)
  const MAX = Number(BALANCE / BigInt(10 ** 18))
  const TYPEHASH_GHO = initReads?.[1].result as `0x${string}`
  const NONCE_GHO = Number(initReads?.[2].result)
  const TYPEHASH_GHOTICKET = initReads?.[3].result as `0x${string}`
  const NONCE_GHOTICKET = Number(initReads?.[4].result)
  const { send, isSuccess, isError } = useTransact({
    chainId,
    contract,
    method: 'createOrder',
    args: steps.tx3,
  })
  const handleData = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      [e.target.name]: value > 99 ? 99 : value < 0 ? 0 : value,
    })
  }
  useEffect(() => {
    if (isConnected)
      setData({
        ...data,
        ['deadline']:
          hdm.hours * 3600000 + hdm.days * 86400000 + hdm.months * 2592000000,
      })
  }, [hdm])
  useEffect(() => {
    if (isConnected)
      setSteps({
        ...steps,
        ready1:
          data.amount > 0 &&
          data.amount <= MAX &&
          data.nbTickets > 0 &&
          data.nbTickets <= 10 &&
          data.deadline >= 3599400,
      })
  }, [data])
  useEffect(() => {
    if (isConnected && signature) {
      if (!steps.sign1)
        setSteps({
          ...steps,
          sign1: convert(signature),
          ready2: true,
        })
      else if (!steps.sign2)
        setSteps({
          ...steps,
          sign2: convert(signature),
          ready3: true,
        })
    }
  }, [signature, isSuccess])
  useEffect(() => {
    if (!isSuccess && steps.tx3 && steps.tickets.length == 0) {
      send()
      setSteps({
        ...steps,
        tickets: secrets.slice(1, data.nbTickets + 1) as `0x${string}`[],
      })
    } else if (isSuccess || isError) {
      setIsLoading(false)
    }
  }, [steps])
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
          ) : !isSuccess ? (
            <FaRegPaperPlane className="rotate-12" />
          ) : (
            <FaRegCircleCheck />
          )
        }
        loading={isLoading}
        ready={
          steps.ready1 && !isLoading
            ? 'halo-button text-lime-300 cursor-pointer'
            : ''
        }
        onClick={() => {
          setIsLoading(true)
          if (steps.ready1 && !steps.sign1) {
            const sign1: Sign1 = {
              chainId: chainId,
              contactAddr: contract?.address as `0x${string}`,
              typehash: TYPEHASH_GHOTICKET,
              address: address as `0x${string}`,
              amount: BigInt(data.amount) * BigInt(10 ** 18),
              orderId: keccak256(
                encodePacked(
                  ['address', 'uint256'],
                  [address as `0x${string}`, BigInt(NONCE_GHOTICKET)]
                )
              ),
              orderSecret: secrets[0],
            }
            signRequest({ ...generateSign1(sign1) })
            setIsLoading(false)
          } else if (steps.ready2 && !steps.sign2) {
            const sign2: Sign2 = {
              chainId: chainId,
              contactAddr: gho?.address as `0x${string}`,
              typehash: TYPEHASH_GHO,
              owner: address as `0x${string}`,
              spender: contract!.address as `0x${string}`,
              value: BigInt(data.amount) * BigInt(10 ** 18),
              nonce: BigInt(NONCE_GHO),
              deadline: BigInt(new Date().getTime() + 600),
            }
            signRequest({ ...generateSign2(sign2) })
            setIsLoading(false)
          } else if (steps.ready3 && !steps.tx3) {
            const tx3 = [
              BigInt(data.amount) * BigInt(10 ** 18),
              BigInt(new Date().getTime() + data.deadline),
              data.stream ? 1 : 0,
              secrets.slice(1, data.nbTickets + 1) as `0x${string}`[],
              steps.sign2,
            ]
            setSteps({ ...steps, tx3: tx3 as any })
          }
        }}
      />
      <div
        className={cn(
          'flex flex-col h-full border border-cyan-400 mt-2 items-center justify-start',
          !isConnected || !contract ? 'w-full' : '',
          isLoading || steps.sign1 ? 'pointer-events-none' : ''
        )}
      >
        {!isConnected ? (
          <PleaseConnect />
        ) : !contract ? (
          <WrongChain />
        ) : (
          <div>
            <span className="border-b-1 text-cyan-300 border-cyan-300 flex w-full justify-between">
              <div />
              <span
                className={cn(
                  steps.ready1 && !steps.sign1
                    ? 'animate-pulse text-orange-400'
                    : ''
                )}
              >
                1. Sign Tickets
              </span>
              <FaArrowRightLong className="h-6 w-6 p-1" />
              <span
                className={cn(
                  steps.ready2 && !steps.sign2
                    ? 'animate-pulse text-orange-400'
                    : ''
                )}
              >
                2. Sign Approval
              </span>
              <FaArrowRightLong className="p-1 h-6 w-6" />
              <span
                className={cn(
                  steps.ready3 && !steps.tx3
                    ? 'animate-pulse text-orange-400'
                    : ''
                )}
              >
                3. Deposit $GHO
              </span>
              <div />
            </span>
            <div className="tracking-normal flex flex-wrap justify-between p-2 pb-0 border-b-1 border-cyan-800">
              <div className="p-0">
                <div className="text-sm px-2 py-0 items-start w-64 flex flex-row">
                  <span className="text-sm font-mono">$GHO Amount</span>
                  <span className="pl-0.5 text-red-500">*</span>
                </div>
                <Input
                  isRequired
                  name="amount"
                  size="sm"
                  type="number"
                  min={0}
                  max={MAX}
                  value={data.amount.toString()}
                  onChange={handleData}
                  errorMessage={
                    0 > data.amount || data.amount > MAX ? 'Invalid amount' : ''
                  }
                  classNames={textClassNames}
                  startContent={
                    <button
                      className="focus:outline-none text-xs text-gray-300"
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
                  min={1}
                  max={10}
                  value={data.nbTickets.toString()}
                  onChange={handleData}
                  errorMessage={
                    1 > data.nbTickets || data.nbTickets > 10
                      ? 'Invalid number'
                      : ''
                  }
                  classNames={textClassNames}
                  startContent={
                    <button
                      className="focus:outline-none text-xs text-gray-300"
                      onClick={() => setData({ ...data, nbTickets: 10 })}
                    >
                      MAX
                    </button>
                  }
                />
              </div>
              <div className="p-0">
                <div className="text-sm px-2 py-0 items-start w-full flex flex-row">
                  <span className="text-sm font-mono">Deadline</span>
                  <span className="pl-0.5 text-red-500">*</span>
                  {hdm.hours * 3600000 +
                    hdm.days * 86400000 +
                    hdm.months * 2592000000 >
                    3600000 && (
                    <div
                      className="pl-2 pt-0.5 text-cyan-500 cursor-pointer text-xs"
                      onClick={() => setHdm({ hours: 1, days: 0, months: 0 })}
                    >
                      reset
                    </div>
                  )}
                </div>
                <div className="flex flex-row w-64">
                  <Input
                    name="months"
                    label="Months"
                    size="sm"
                    type="number"
                    min={hdm.days + hdm.hours === 0 ? 1 : 0}
                    max={99}
                    value={hdm.months.toString()}
                    onChange={handleDeadline}
                    classNames={textClassNames}
                  />
                  <Input
                    name="days"
                    label="Days"
                    size="sm"
                    type="number"
                    min={hdm.months + hdm.hours === 0 ? 1 : 0}
                    max={99}
                    value={hdm.days.toString()}
                    onChange={handleDeadline}
                    classNames={textClassNames}
                  />
                  <Input
                    name="hours"
                    label="Hours"
                    size="sm"
                    type="number"
                    min={hdm.months + hdm.days === 0 ? 1 : 0}
                    max={99}
                    value={hdm.hours.toString()}
                    onChange={handleDeadline}
                    errorMessage={
                      hdm.months + hdm.days + hdm.hours === 0
                        ? 'Min : 1 hour'
                        : ''
                    }
                    classNames={textClassNames}
                  />
                </div>
                <div className="text-sm w-full flex justify-start pl-2 items-center h-8">
                  Expiration :
                  <span className="pl-6 text-cyan-200 tracking-wider font-semibold">
                    {new Date(
                      new Date().getTime() + data.deadline
                    ).toLocaleString()}
                  </span>
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
            <div className="flex flex-col items-center justify-between text-xs">
              {steps.tickets.length > 0 && steps.tickets}
            </div>
          </div>
        )}
      </div>
    </>
  )
}
