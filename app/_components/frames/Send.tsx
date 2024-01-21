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
} from 'react-icons/fa6'
import { Input, Switch } from '@nextui-org/react'
import { keccak256, toHex } from 'viem'
import { nanoid } from 'nanoid'
import { read } from 'fs'

const textClassNames = {
  base: 'p-1 rounded',
  label: '!text-white truncate text-sm font-mono',
  mainWrapper: 'h-9 w-full',
  inputWrapper: '!rounded !bg-gray-900 py-0 px-2 h-9',
  input: '!text-white !bg-gray-900 text-right no-arrow px-1',
  errorMessage: 'text-right',
}

const switchClassNames = {
  wrapper:
    'bg-gray-950 group-data-[selected=true]:bg-cyan-800 ring-1 ring-cyan-400 ring-offset-2 ring-offset-gray-950',
  label: 'text-white ml-1 truncate',
}

type Data = {
  amount: number
  deadline: number
  stream: boolean
  nbTickets: number
  orderSecret: `0x${string}`
  ticketSecret: `0x${string}`[]
}

const generateSecrets = (): `0x${string}`[] =>
  Array.from({ length: 11 }, () => keccak256(toHex(nanoid(32))))

export default function Send() {
  const chainId = useChainId()
  const addSnackbar = useSnackbar()
  const { setOpen, openSwitchNetworks } = useModal()
  const { isConnected, address } = useAccount()
  const contract = load('ATM', chainId)
  const gho = load('GHO', chainId)
  const [steps, setSteps] = useState({
    ready1: false,
    sign1: false,
    ready2: false,
    sign2: false,
    ready3: false,
    tx3: false,
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
  const { data: account } = useContractReads({
    contracts: [
      {
        ...gho,
        functionName: 'balanceOf',
        args: [address as `0x${string}`],
      },
      {
        ...gho,
        functionName: 'decimals',
      },
    ],
  })
  const balance = Number(account?.[0].result)
  const decimals = account?.[1].result as number
  const max = balance / Math.pow(10, decimals)
  const handleData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.name === 'amount') {
      const num = Number(e.target.value)
      e.target.value = (num > max ? max : num < 0 ? 0 : num).toString()
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
    setData({
      ...data,
      ['deadline']:
        hdm.hours * 3600000 + hdm.days * 86400000 + hdm.months * 2592000000,
    })
  }, [hdm])
  useEffect(() => {
    setSteps({
      ...steps,
      ready1:
        data.amount > 0 &&
        data.amount <= max &&
        data.nbTickets > 0 &&
        data.nbTickets <= 10 &&
        data.deadline >= 3599400,
    })
  }, [data])
  useEffect(() => {
    if (!isConnected) setOpen(true)
    else console.log()
  }, [])
  useEffect(() => {
    if (!contract) openSwitchNetworks()
  }, [chainId])
  return (
    <>
      <Title
        label="Send Ticket[s]"
        logo={!isConnected ? <FaRegPaperPlane /> : <FaCheck />}
        loading={isLoading}
        ready={
          steps.ready1 && !isLoading
            ? 'halo-button text-lime-300 cursor-pointer'
            : ''
        }
        onClick={() => setIsLoading(true)}
      />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 items-center justify-start">
        {!isConnected ? (
          <PleaseConnect />
        ) : !contract ? (
          <WrongChain />
        ) : (
          <div>
            <span className="border-b-1 text-cyan-300 border-cyan-300 flex w-full justify-between">
              <div />
              1. Sign Tickets <FaArrowRightLong className="h-6 w-6 p-1" />
              2. Sign Approval <FaArrowRightLong className="p-1 h-6 w-6" />
              3. Deposit $GHO
              <div />
            </span>
            <div className="tracking-normal flex flex-wrap justify-between p-1 border-b-1 border-cyan-800">
              <div className="p-2">
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
                  max={max}
                  value={data.amount.toString()}
                  onChange={handleData}
                  errorMessage={
                    0 > data.amount || data.amount > max ? 'Invalid amount' : ''
                  }
                  classNames={textClassNames}
                  startContent={
                    <button
                      className="focus:outline-none text-xs text-gray-300"
                      onClick={() => setData({ ...data, amount: max })}
                    >
                      max
                    </button>
                  }
                />
              </div>
              <div className="p-2 w-24">
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
                      max
                    </button>
                  }
                />
              </div>
              <div className="p-2">
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
                <div className="text-sm w-full flex justify-start pl-2 items-center h-10">
                  Expiration :
                  <span className="pl-6 text-cyan-200 tracking-wider font-semibold">
                    {new Date(
                      new Date().getTime() + data.deadline
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="px-4 py-2 flex flex-col w-24 items-center justify-start">
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
        )}
      </div>
    </>
  )
}
