'use client'
import { useEffect, useState } from 'react'
import { cn } from '@utils/tw'
import { useChains, useModal } from 'connectkit'
import { useAccount, useSwitchChain } from 'wagmi'
import load from '@contracts/loader'
import { useCall } from '@components/hooks/Caller'
import { useTransact } from '@components/hooks/Transact'
import Title from '@components/elements/Title'
import {
  FaRegMoneyBill1,
  FaLock,
  FaCircleNotch,
  FaBan,
  FaQrcode,
  FaArrowRightLong,
  FaRegCopy,
  FaWallet,
  FaLink,
  FaFileSignature,
  FaArrowRightToBracket,
  FaRegCircleCheck,
} from 'react-icons/fa6'
import {
  Modal,
  ModalContent,
  ModalBody,
  useDisclosure,
} from '@nextui-org/react'
import { useParams } from 'react-router-dom'
import { extractFromTicketHash } from '@utils/packing'
import { Hex, Address, zeroAddress, keccak256, encodePacked } from 'viem'
import { Progress } from '@nextui-org/react'

const blankTicket = {
  chainId: 0,
  content: {
    orderId: '' as Hex,
    orderSecret: '' as Hex,
    ticketSecret: '' as Hex,
    signature: {
      v: BigInt(0),
      r: '' as Hex,
      s: '' as Hex,
    },
  },
}
const blankData = {
  orderId: '' as Hex,
  creator: '' as Address,
  totalAmount: 0,
  createdAt: 0,
  deadline: 0,
  closed: false,
  nbTickets: 0,
  status: [],
  ticketIndex: 0,
  ticketId: '' as Hex,
  amount: 0,
  streamed: false,
}
const blankSteps = {
  check1: [] as any,
  txArgs1: false,
  tx1: [] as any,
  txArgs2: false,
  tx2: [] as any,
}

export default function Claim() {
  const { isOpen, onClose } = useDisclosure({ defaultOpen: true })
  const { ticketCode } = useParams()
  const [ticket, setTicket] = useState(blankTicket)
  const chains = useChains()
  const chainName = chains.find((chain) => chain.id === ticket.chainId)?.name
  const { isConnected, address, chainId: selectedChainId } = useAccount()
  const { setOpen } = useModal()
  const { switchChain } = useSwitchChain()
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
  }>(blankData)
  const [loadingTicket, setLoadingTicket] = useState(true)
  const decodeTicket = async (ticketCode: string) => {
    const decoded = await extractFromTicketHash(ticketCode)
    if (decoded) setTicket(decoded)
    else setLoadingTicket(false)
  }
  const {
    result: resultData1,
    isSuccess: isSuccessCall1,
    isError: isErrorCall1,
  } = useCall({
    calls: [
      {
        chainId: ticket.chainId,
        contract: contract!,
        functionName: 'getFullOrder',
        args: [ticket.content.orderId],
      },
      {
        chainId: ticket.chainId,
        contract: contract!,
        functionName: 'isValid',
        args: [ticket.content],
      },
    ],
    initData: [
      {
        order: {
          id: '',
          order: {
            creator: '',
            amount: BigInt(0),
            createdAt: BigInt(0),
            deadline: BigInt(0),
            streamed: BigInt(0),
            closed: BigInt(0),
          },
          nbTickets: BigInt(0),
        },
        status: { ticketIds: [], claimers: [] },
      },
      ['', BigInt(0), BigInt(0)],
    ],
    active: ticket.chainId > 0 && loadingTicket && !data.orderId,
  })
  useEffect(() => {
    if (isErrorCall1 || (isSuccessCall1 && !resultData1.isValid[0]))
      setLoadingTicket(false)
    else if (isSuccessCall1 && !data.orderId) {
      const nbTickets = Number(resultData1.getFullOrder.order.nbTickets)
      const status = resultData1.getFullOrder.status.claimers.map(
        (c: Address) => Number(c !== zeroAddress)
      )
      for (let i = 0; i < 10 - nbTickets; i++) {
        status.push(-1)
      }
      setData({
        orderId: resultData1.getFullOrder.order.id,
        creator: resultData1.getFullOrder.order.order.creator,
        totalAmount:
          Number(
            resultData1.getFullOrder.order.order.amount / BigInt(10 ** 10)
          ) /
          10 ** 8,
        createdAt:
          Number(resultData1.getFullOrder.order.order.createdAt) * 1000,
        deadline: Number(resultData1.getFullOrder.order.order.deadline) * 1000,
        closed: Boolean(resultData1.getFullOrder.order.order.closed),
        nbTickets: nbTickets,
        status: status,
        ticketIndex:
          resultData1.getFullOrder.status.ticketIds.indexOf(
            resultData1.isValid[0]
          ) + 1,
        ticketId: resultData1.isValid[0],
        amount: Number(resultData1.isValid[1] / BigInt(10 ** 10)) / 10 ** 8,
        streamed: Boolean(resultData1.isValid[2]),
      })
    }
  }, [resultData1])
  const [steps, setSteps] = useState(blankSteps)
  const [reserved, setReserved] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const {
    sendTx: sendTx1,
    isReadyTx: isReadyTx1,
    isLoadingTx: isLoadingTx1,
    isSuccessTx: isSuccessTx1,
  } = useTransact({
    chainId: ticket.chainId,
    contract,
    method: 'reserveTicket',
    args: steps.tx1,
    enabled: steps.txArgs1,
  })
  const {
    sendTx: sendTx2,
    isReadyTx: isReadyTx2,
    isLoadingTx: isLoadingTx2,
    isSuccessTx: isSuccessTx2,
    txLink: txLink2,
  } = useTransact({
    chainId: ticket.chainId,
    contract,
    method: 'claimTicket',
    args: steps.tx2,
    enabled: steps.txArgs2,
  })
  const mustCheckReservation =
    data.amount > 0 &&
    isConnected &&
    ticket.chainId === selectedChainId &&
    steps.check1.length > 0 &&
    seconds < 1 &&
    !reserved &&
    (!steps.txArgs1 || isSuccessTx1)
  const { result: resultData2, isSuccess: isSuccessCall2 } = useCall({
    calls: [
      {
        chainId: ticket.chainId,
        contract: contract!,
        functionName: 'getReservation',
        args: steps.check1,
      },
    ],
    initData: [BigInt(0)],
    active: mustCheckReservation,
  })
  const handleReservation = () => {
    const reservation = Number(resultData2.getReservation) * 1000
    const now = new Date().getTime()
    if (reservation > now)
      setSeconds(Math.floor((reservation - now) / 1000) + 5)
    else if (reservation > 0) setReserved(true)
    else
      setSteps({
        ...steps,
        txArgs1: true,
        tx1: steps.check1,
      })
  }
  useEffect(() => {
    if (isConnected && mustCheckReservation && resultData2) handleReservation()
  }, [isConnected, address, resultData2, isSuccessCall2])
  const submit = () => {
    if (!isConnected) setOpen(true)
    else if (ticket.chainId !== selectedChainId)
      switchChain({ chainId: ticket.chainId })
    else if (isReadyTx1 && !isSuccessTx1 && !reserved) sendTx1({ index: 1 })
    else if (isReadyTx2 && !isSuccessTx2) sendTx2({ index: 2 })
  }
  const reset = () => {
    //setTicket(blankTicket)
    //setData(blankData)
    //setLoadingTicket(true)
    //setSteps(blankSteps)
    setReserved(false)
    setSeconds(0)
  }
  useEffect(() => {
    if (seconds > 0 && !reserved) {
      setReserved(true)
      const timer = setInterval(() => {
        setSeconds((prev) => prev - 1)
        if (seconds <= 1) clearInterval(timer)
      }, 1000)
    } else if (seconds < 1 && reserved && steps.tx2.length === 0)
      setSteps({
        ...steps,
        txArgs2: true,
        tx2: [ticket.content],
      })
  }, [seconds, reserved])
  useEffect(() => {
    if (data.amount > 0) {
      setLoadingTicket(false)
      if (address)
        setSteps({
          ...blankSteps,
          check1: [
            keccak256(
              encodePacked(
                ['address', 'bytes32', 'bytes32'],
                [
                  address!,
                  ticket.content.orderSecret,
                  ticket.content.ticketSecret,
                ]
              )
            ),
          ],
        })
    }
  }, [data, address])
  useEffect(() => {
    if (ticketCode) decodeTicket(ticketCode)
  }, [ticketCode])
  useEffect(() => {
    if (isConnected) reset()
  }, [isConnected, address, selectedChainId])
  return (
    <>
      <Title
        label="Claim Ticket"
        logo={
          data.amount === 0 ? (
            <FaRegMoneyBill1 className="text-3xl" />
          ) : !isConnected ? (
            <FaWallet />
          ) : ticket.chainId !== selectedChainId ? (
            <FaLink className="text-2xl" />
          ) : !isSuccessTx1 && !reserved ? (
            <FaFileSignature className="ml-2" />
          ) : seconds > 0 ? (
            <span className="text-xl">{seconds}</span>
          ) : !isSuccessTx2 ? (
            <FaArrowRightToBracket className="rotate-90 ml-0.5" />
          ) : (
            <FaRegCircleCheck className="text-green-500 text-xl" />
          )
        }
        loading={isLoadingTx1 || isLoadingTx2}
        ready={data.amount > 0 && seconds < 1 && !isSuccessTx2}
        onClick={submit}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl',
          data.amount === 0 ? 'w-full' : 'bg-blue-800 bg-opacity-10'
        )}
      >
        {!ticketCode ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <FaLock className="mb-4 text-6xl" />
            <span className="text-xl font-bold w-44 text-center">
              Only accessible via a link or by scanning a QR code
            </span>
          </div>
        ) : loadingTicket ? (
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
              Invalid, Expired or Already Claimed
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-start w-full h-full">
            <div className="border-b-1 text-cyan-300 border-cyan-300 flex w-full items-center justify-between font-mono tracking-tighter text-xs">
              <div />
              <span
                className={cn(
                  data.amount > 0 &&
                    isConnected &&
                    ticket.chainId === selectedChainId &&
                    isReadyTx1 &&
                    !isSuccessTx1 &&
                    !reserved
                    ? 'animate-pulse text-orange-400 font-bold'
                    : isSuccessTx1 || reserved
                      ? 'text-green-400'
                      : ''
                )}
              >
                1. Reserve Ticket
              </span>
              <FaArrowRightLong className="h-5 w-5 p-1" />
              <span
                className={cn(
                  (isSuccessTx1 || reserved) && seconds < 1 && !isSuccessTx2
                    ? 'animate-pulse text-orange-400 font-bold'
                    : isSuccessTx2
                      ? 'text-green-400'
                      : ''
                )}
              >
                2. Claim Ticket
              </span>
              <div />
            </div>
            <div className="w-full flex flex-row items-center justify-between text-3xl font-bold text-green-500 p-2 pb-0">
              <FaQrcode />
              <span>VALID TICKET</span>
              <FaQrcode />
            </div>
            <div className="h-full flex flex-col text-sm items-center justify-between text-center font-mono break-words px-3 pb-1">
              {isSuccessTx2 && (
                <Modal
                  isOpen={isOpen}
                  onClose={onClose}
                  placement="center"
                  classNames={{ base: 'm-2', closeButton: 'text-red-500' }}
                >
                  <ModalContent className="w-72 h-80 overflow-hidden bg-gray-950 bg-opacity-90 rounded-2xl border-1 border-green-500">
                    {() => (
                      <ModalBody className="p-4 flex flex-col w-full h-full items-center justify-between font-mono">
                        <div className="firework"></div>
                        <div className="firework"></div>
                        <div className="firework"></div>
                        <div />
                        <span className="text-green-500 text-3xl text-center font-bold">
                          SUCCESSFULLY CLAIMED!
                        </span>
                        <div className="flex flex-col w-full items-center justify-center">
                          <div className="flex flex-col w-full border-1 border-amber-500 rounded-xl p-3">
                            <div className="w-full flex flex-row items-center justify-start text-xl">
                              <span className="text-cyan-400 pr-2">Token:</span>
                              <span>$GHO</span>
                            </div>
                            <div className="w-full flex flex-row items-center justify-start text-xl">
                              <span className="text-cyan-400 pr-2">
                                Amount:
                              </span>
                              <span>{data.amount}</span>
                            </div>
                          </div>
                        </div>
                        <a
                          className="flex flex-row hover:underline text-green-500 pl-3"
                          href={txLink2}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="text-sm">Confirmed transaction</span>
                          <FaLink className="ml-2 w-5 h-5" />
                        </a>
                      </ModalBody>
                    )}
                  </ModalContent>
                </Modal>
              )}
              <div />
              <div className="w-full flex flex-col border-1 border-blue-500 rounded-xl items-start justify-center">
                <span className="w-full text-lg font-bold text-blue-500 border-b-1 border-blue-500">
                  ORIGINAL ORDER
                </span>
                <div className="w-full flex flex-col px-2 py-1 items-start justify-center text-sm">
                  <div className="w-full flex flex-row items-center justify-start">
                    <span className="text-cyan-400 pr-1.5">chain:</span>
                    <span className="font-bold text-amber-500 tracking-wide">
                      {chainName}
                    </span>
                  </div>
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
                    <span className="text-cyan-400 pr-1.5">stream:</span>
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
