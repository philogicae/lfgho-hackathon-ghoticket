'use client'
import { useEffect, useState } from 'react'
import { cn } from '@utils/tw'
import { useWebSocketPublicClient } from 'wagmi'
import load from '@contracts/loader'
import Title from '@components/elements/Title'
import {
  FaRegMoneyBill1,
  FaLock,
  FaCircleNotch,
  FaBan,
  FaQrcode,
  FaArrowRightLong,
  FaRegCopy,
} from 'react-icons/fa6'
import { useParams } from 'react-router-dom'
import { extractFromTicketHash } from '@utils/packing'
import { Hex, Address, zeroAddress } from 'viem'
import { Progress } from '@nextui-org/react'

export default function Claim() {
  const { ticketCode } = useParams()
  const [ticket, setTicket] = useState({
    chainId: 0,
    content: {
      orderId: '',
      orderSecret: '',
      ticketSecret: '',
      signature: {
        v: BigInt(0),
        r: '' as `0x${string}`,
        s: '' as `0x${string}`,
      },
    },
  })
  //const { isConnected } = useAccount()
  //const { setOpen, openSwitchNetworks } = useModal()
  //const selectedChainId = useChainId()
  const contract = load('QRFlow', ticket.chainId)
  const [data, setData] = useState<{
    orderId: Hex
    creator: Address
    totalAmount: number
    createdAt: number
    deadline: number
    closed: boolean
    nbTickets: number
    status: number[]
    ticketIndex: number
    ticketId: Hex
    amount: number
    streamed: boolean
  }>({
    orderId: '0x0',
    creator: '0x0',
    totalAmount: 0,
    createdAt: 0,
    deadline: 0,
    closed: false,
    nbTickets: 0,
    status: [],
    ticketIndex: 0,
    ticketId: '0x0',
    amount: 0,
    streamed: false,
  })
  const [isLoading, setIsLoading] = useState(true)
  const decodeTicket = async (ticketCode: string) => {
    const decoded = await extractFromTicketHash(ticketCode)
    if (decoded) setTicket(decoded)
    else setIsLoading(false)
  }
  const wss = useWebSocketPublicClient(
    ticket.chainId > 0 ? { chainId: ticket.chainId } : {}
  )
  ticket.chainId > 0 &&
    isLoading &&
    wss
      ?.multicall({
        contracts: [
          {
            ...contract!,
            functionName: 'getFullOrder',
            args: [ticket.content.orderId],
          },
          {
            ...contract!,
            functionName: 'isValid',
            args: [ticket.content],
          },
        ],
      })
      .then((res: any[]) => {
        const x = res![0].result as {
          order: {
            id: Hex
            order: {
              creator: Address
              amount: bigint
              createdAt: bigint
              deadline: bigint
              streamed: bigint
              closed: bigint
            }
            nbTickets: bigint
          }
          status: { ticketIds: Hex[]; claimers: Address[] }
        }
        const y = res![1].result as [Hex, bigint, bigint]
        const nbTickets = Number(x.order.nbTickets)
        const status = x.status.claimers.map((c) => Number(c !== zeroAddress))
        for (let i = 0; i < 10 - nbTickets; i++) {
          status.push(-1)
        }
        setData({
          orderId: x.order.id,
          creator: x.order.order.creator,
          totalAmount:
            Number(x.order.order.amount / BigInt(10 ** 10)) / 10 ** 8,
          createdAt: Number(x.order.order.createdAt) * 1000,
          deadline: Number(x.order.order.deadline) * 1000,
          closed: Boolean(x.order.order.closed),
          nbTickets: nbTickets,
          status: status,
          ticketIndex: x.status.ticketIds.indexOf(y[0]) + 1,
          ticketId: y[0],
          amount: Number(y[1] / BigInt(10 ** 10)) / 10 ** 8,
          streamed: Boolean(y[2]),
        })
      })
      .catch(() => setIsLoading(false))
  useEffect(() => {
    if (data.amount > 0) setIsLoading(false)
  }, [data])
  useEffect(() => {
    if (ticketCode) decodeTicket(ticketCode)
  }, [ticketCode])
  return (
    <>
      <Title
        label="Claim Ticket"
        logo={<FaRegMoneyBill1 className="text-3xl" />}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl',
          data.amount === 0 ? 'w-full' : ''
        )}
      >
        {!ticketCode ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <FaLock className="mb-4 text-6xl" />
            <span className="text-xl font-bold w-44 text-center">
              Only accessible via a link or by scanning a QR code
            </span>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center w-full h-full mb-10">
            <FaCircleNotch className="mb-4 text-6xl animate-spin" />
            <span className="text-xl font-bold w-44 text-center">
              Loading ticket...
            </span>
          </div>
        ) : data.amount === 0 ? (
          <div className="flex flex-col items-center justify-center w-full h-full mb-10">
            <FaBan className="mb-4 text-6xl" />
            <span className="text-xl font-bold w-44 text-center">
              Invalid or Expired
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start w-full h-full">
            <div className="border-b-1 text-cyan-300 border-cyan-300 flex w-full items-center justify-between font-mono tracking-tighter text-xs">
              <div />
              <span
                className={cn(
                  false
                    ? 'animate-pulse text-orange-400 font-bold'
                    : false
                      ? 'text-green-400'
                      : ''
                )}
              >
                1. Reserve Ticket
              </span>
              <FaArrowRightLong className="h-5 w-5 p-1" />
              <span
                className={cn(
                  false
                    ? 'animate-pulse text-orange-400 font-bold'
                    : false
                      ? 'text-green-400'
                      : ''
                )}
              >
                2. Claim Ticket
              </span>
              <div />
            </div>
            <div className="w-full flex flex-row items-center justify-between text-3xl font-bold text-green-500 p-2 pb-1">
              <FaQrcode />
              <span>VALID TICKET</span>
              <FaQrcode />
            </div>
            <div className="h-full flex flex-col text-sm items-center justify-between text-center font-mono break-words px-3 py-1">
              <div />
              <div className="w-full flex flex-col border-1 border-blue-500 rounded-xl items-start justify-center">
                <span className="w-full text-lg font-bold text-blue-500 border-b-1 border-blue-500">
                  ORIGINAL ORDER
                </span>
                <div className="w-full flex flex-col px-2 py-1 items-start justify-center text-sm">
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-1.5">from:</span>
                    <span>
                      {data.creator.slice(0, 10) +
                        '...' +
                        data.creator.slice(-10)}
                    </span>
                    <FaRegCopy
                      className="pl-2 text-xl text-amber-500 cursor-pointer hover:text-amber-200"
                      onClick={() =>
                        navigator.clipboard.writeText(data.creator)
                      }
                    />
                  </div>
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-1.5">id:</span>
                    <span>
                      {data.orderId.slice(0, 10) +
                        '...' +
                        data.orderId.slice(-10)}
                    </span>
                    <FaRegCopy
                      className="pl-2 text-xl text-amber-500 cursor-pointer hover:text-amber-200"
                      onClick={() =>
                        navigator.clipboard.writeText(data.orderId)
                      }
                    />
                  </div>
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-1.5">
                      total amount $GHO:
                    </span>
                    <span>{data.totalAmount}</span>
                  </div>
                  <div className="w-full flex flex-row items-center justify-start py-1">
                    <span className="text-sm text-cyan-400 pr-1.5">
                      claim status:
                    </span>
                    <div className="border-1 border-gray-500 rounded-lg p-0.5 pl-2.5 pr-0">
                      {data.status.map((s, k) => (
                        <span
                          key={k}
                          className={cn(
                            'pr-2.5',
                            s > 0
                              ? 'text-green-500'
                              : s === 0
                                ? 'text-amber-500'
                                : 'text-gray-800'
                          )}
                        >
                          ●
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-2 py-1 flex flex-col w-full border-1 border-amber-500 rounded-xl">
                <div className="w-full flex flex-row items-center justify-between">
                  <span className="text-amber-500">created at:</span>
                  <span className="text-cyan-500 font-bold tracking-wider">
                    {new Date(data.createdAt).toLocaleString()}
                  </span>
                  <div />
                </div>
                <Progress
                  size="sm"
                  aria-label="Progress"
                  value={
                    (100 * (new Date().getTime() - data.createdAt)) /
                    (data.deadline - data.createdAt)
                  }
                  classNames={{
                    indicator: 'bg-gradient-to-r from-red-500 to-amber-500',
                  }}
                  className="py-1"
                />
                <div className="w-full flex flex-row items-center justify-between">
                  <span className="text-amber-500">expires on: </span>
                  <span className="text-red-500 font-bold tracking-wider">
                    {new Date(data.deadline).toLocaleString()}
                  </span>
                  <div />
                </div>
              </div>
              <div className="w-full flex flex-col border-1 border-green-500 rounded-xl items-start justify-center">
                <div className="w-full flex flex-row items-center justify-start text-lg border-b-1 border-green-400">
                  <span className="px-2 mr-3 text-cyan-400 border-r-1 border-green-400">{`#${data.ticketIndex < 10 ? '0' : ''}${data.ticketIndex}`}</span>
                  <span className="font-bold text-green-500 w-full pr-14">
                    YOUR TICKET
                  </span>
                </div>
                <div className="w-full flex flex-col px-2 py-1 items-start justify-center text-sm">
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-1.5">id:</span>
                    <span>
                      {data.ticketId.slice(0, 10) +
                        '...' +
                        data.ticketId.slice(-10)}
                    </span>
                    <FaRegCopy
                      className="pl-2 text-xl text-amber-500 cursor-pointer hover:text-amber-200"
                      onClick={() =>
                        navigator.clipboard.writeText(data.ticketId)
                      }
                    />
                  </div>
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-1.5">amount $GHO:</span>
                    <span>{data.amount}</span>
                  </div>
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-0.5">stream:</span>
                    <span className="text-xs pt-0.5">
                      {data.streamed ? '🟢' : '🔴'}
                    </span>
                  </div>
                </div>
              </div>
              <div />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
