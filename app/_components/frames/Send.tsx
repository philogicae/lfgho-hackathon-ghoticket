'use client'
import { useEffect, useState, useRef } from 'react'
import { cn } from '@utils/tw'
import { useModal } from 'connectkit'
import { useAccount } from 'wagmi'
import load from '@contracts/loader'
import { generateTicketPermit, generateGhoPermit } from '@utils/permits'
import { useCall } from '@components/hooks/Caller'
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
  FaPrint,
  FaShareFromSquare,
} from 'react-icons/fa6'
import {
  Input,
  Switch,
  Snippet,
  Pagination,
  Modal,
  ModalContent,
  ModalBody,
  ModalHeader,
  ModalFooter,
  useDisclosure,
  Button,
} from '@nextui-org/react'
import { keccak256, toHex, encodePacked, Hex, Signature } from 'viem'
import { nanoid } from 'nanoid'
import { generateBatchTicketHash } from '@utils/packing'
import QrSvg from '@wojtekmaj/react-qr-svg'

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
const generateTicketIds = (
  orderSecret: Hex,
  ticketSecrets: Hex[],
  nb: number
): Hex[] =>
  ticketSecrets
    .slice(0, nb)
    .map((ticketSecret) =>
      keccak256(
        encodePacked(['bytes32', 'bytes32'], [orderSecret, ticketSecret])
      )
    )
const restrict = (n: any, min: number, max: number) =>
  Number(n) > max ? max : Number(n) < min ? min : n

const blankSteps = {
  ready1: false,
  sign1: '' as Hex,
  ready2: false,
  sign2: {} as Signature,
  ready3: false,
  txArgs3: false,
  tx3: [] as any,
  executed: false,
  tickets: [] as string[],
}
const initOrder = () => {
  return {
    id: '' as Hex,
    secret: generateHex(),
    ticketSecrets: generateBatchHex(),
    amount: BigInt(0),
    signDeadline: BigInt(0),
  }
}
const blankContractData = {
  DECIMALS: 0,
  MAX: 0,
  NONCE_GHO: BigInt(0),
  NONCE_QRFLOW: BigInt(0),
  updatedOrderId: '' as Hex,
}
const blankData = {
  amount: '',
  deadline: 0,
  stream: false,
  nbTickets: 0,
  ticketIds: [],
}

export default function Send() {
  const { isConnected, address, chainId } = useAccount()
  const { setOpen, openSwitchNetworks } = useModal()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const gho = load('Gho', chainId)
  const contract = load('QRFlow', chainId)
  const [steps, setSteps] = useState(blankSteps)
  const order = useRef<{
    id: Hex
    secret: Hex
    ticketSecrets: Hex[]
    amount: bigint
    signDeadline: bigint
  }>(initOrder())
  const [currentTicket, setCurrentTicket] = useState(1)
  const { signRequest, signature, isLoadingSign, isErrorSign, convert } =
    useSigner()
  const { sendTx, isReadyTx, isLoadingTx, isSuccessTx, isErrorTx } =
    useTransact({
      chainId: chainId!,
      contract,
      method: 'createOrder',
      args: steps.tx3,
      enabled: steps.txArgs3,
    })
  const isLoading = isLoadingSign || isLoadingTx
  const [contractData, setContractData] = useState<{
    DECIMALS: number
    MAX: number
    NONCE_GHO: bigint
    NONCE_QRFLOW: bigint
    updatedOrderId: Hex
  }>(blankContractData)
  const { result: resultData, isSuccess: isSuccessCall } = useCall({
    calls: [
      {
        contract: gho!,
        functionName: 'decimals',
      },
      {
        contract: gho!,
        functionName: 'balanceOf',
        args: [address!],
      },
      {
        contract: gho!,
        functionName: 'nonces',
        args: [address!],
      },
      {
        contract: contract!,
        functionName: 'getAccountNonce',
        args: [address!],
      },
    ],
    initData: [0, BigInt(0), BigInt(0), BigInt(0)],
    active: isConnected && contract && !contractData.DECIMALS,
  })
  useEffect(() => {
    if (isConnected && isSuccessCall && !contractData.DECIMALS)
      setContractData({
        DECIMALS: resultData.decimals,
        MAX:
          Number(
            resultData.balanceOf /
              BigInt(10 ** (resultData.decimals - PRECISION))
          ) /
          10 ** PRECISION,
        NONCE_GHO: resultData.nonces,
        NONCE_QRFLOW: resultData.getAccountNonce,
        updatedOrderId: keccak256(
          encodePacked(
            ['address', 'uint256'],
            [address!, resultData.getAccountNonce]
          )
        ),
      })
  }, [resultData])
  const [hdm, setHdm] = useState({ hours: 0, days: 0, months: 0 })
  const [data, setData] = useState<{
    amount: any
    deadline: number
    stream: boolean
    nbTickets: number
    ticketIds: Hex[]
  }>(blankData)
  const handleData = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (e.target.name === 'amount') {
      value = value.replace(',', '.')
      value = floatRegex.test(value)
        ? restrict(value, 0, contractData.MAX)
        : data.amount
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
          hdm.hours + hdm.days + hdm.months > 0
            ? new Date().getTime() +
              hdm.hours * 3600000 +
              hdm.days * 86400000 +
              hdm.months * 2592000000
            : 0,
      })
  }, [hdm])
  const submit = () => {
    if (steps.ready1 && !steps.ready2) {
      const tempAmount =
        BigInt(Number(data.amount * 10 ** PRECISION)) *
        BigInt(10 ** (contractData.DECIMALS - PRECISION))
      order.current.amount = tempAmount - (tempAmount % BigInt(data.nbTickets))
      order.current.id = contractData.updatedOrderId
      signRequest({
        args: generateTicketPermit({
          chainId: chainId!,
          contactAddr: contract!.address,
          creator: address!,
          orderId: order.current.id,
          orderSecret: order.current.secret,
        }),
        index: 1,
      })
    } else if (steps.ready2 && !steps.ready3) {
      order.current.signDeadline = BigInt(
        Math.floor(new Date().getTime() / 1000 + 5 * 60)
      )
      setTimeout(
        () =>
          signRequest({
            args: generateGhoPermit({
              chainId: chainId!,
              contactAddr: gho!.address,
              owner: address!,
              spender: contract!.address!,
              value: order.current.amount,
              nonce: contractData.NONCE_GHO,
              deadline: order.current.signDeadline,
            }),
            index: 2,
          }),
        1000
      )
    } else if (steps.ready3 && !isReadyTx)
      setSteps({
        ...steps,
        txArgs3: true,
        tx3: [
          order.current.amount,
          BigInt(Math.floor(data.deadline / 1000)),
          Number(data.stream),
          generateTicketIds(
            order.current.secret,
            order.current.ticketSecrets,
            data.nbTickets
          ),
          steps.sign2,
          order.current.signDeadline,
        ],
      })
    else if (steps.ready3 && isReadyTx && !steps.executed) sendTx({ index: 3 })
  }
  useEffect(() => {
    if (isConnected)
      setSteps({
        ...steps,
        ready1:
          Number(data.amount) > 0 &&
          Number(data.amount) <= contractData.MAX &&
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
          sign1: signature,
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
        } else if (
          steps.ready3 &&
          isReadyTx &&
          !isLoadingTx &&
          !isErrorTx &&
          !steps.executed
        ) {
          submit()
        }
      } else if (!steps.executed) {
        const done = async () =>
          await setSteps({
            ...steps,
            executed: true,
            tickets: await generateBatchTicketHash(
              chainId!,
              order.current.id,
              order.current.secret,
              order.current.ticketSecrets.slice(0, data.nbTickets),
              steps.sign1
            ),
          })
        done()
      }
    }
  }, [steps, isReadyTx, isSuccessTx, isErrorTx])
  const reset = () => {
    setSteps(blankSteps)
    order.current = initOrder()
    setContractData(blankContractData)
    setHdm({ hours: 0, days: 0, months: 0 })
    setData(blankData)
  }
  useEffect(() => {
    if (isConnected) {
      if (!contract) openSwitchNetworks()
      else if (!isLoadingTx && !isSuccessTx) reset()
    }
  }, [isConnected, address, chainId])
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
          ) : !steps.executed ? (
            <FaFileSignature className="ml-2" />
          ) : (
            <FaRegCircleCheck className="text-green-500 text-xl" />
          )
        }
        loading={isLoading}
        ready={steps.ready1 && !isLoading && !steps.executed}
        onClick={submit}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl',
          !isConnected || !contract ? 'w-full' : 'bg-blue-800 bg-opacity-10'
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
                    autoComplete="off"
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
                          setData({
                            ...data,
                            amount: contractData.MAX.toString(),
                          })
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
            <div
              className={cn(
                'flex flex-col items-center h-full w-full text-sm p-2 font-mono break-words overflow-hidden',
                !steps.executed
                  ? 'mt-2 sm:mt-0 sm:justify-center'
                  : 'justify-center'
              )}
            >
              {!steps.executed ? (
                <>
                  <FaPrint className="text-6xl mb-4" />
                  <span className="text-xl font-bold w-48 text-center mb-4">
                    Print your batch of tickets
                  </span>
                  <span className="text-xs text-center w-64 text-red-500">
                    After creation, tickets will be only available until you
                    leave the page. We don&apos;t keep any data, so don&apos;t
                    forget to share or at least to save your links.
                  </span>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-between">
                  <div className="w-full flex flex-row items-center justify-center">
                    <Snippet
                      symbol=""
                      variant="bordered"
                      codeString={steps.tickets
                        .map(
                          (ticket, id) =>
                            `#${id + 1 < 10 ? '0' : ''}${id + 1}` +
                            ': ' +
                            window.location.origin +
                            '/#/claim/' +
                            ticket
                        )
                        .join('\n')}
                      classNames={{
                        base: 'w-52 pl-3 pr-1 py-0 gap-0 border-small  border-green-400',
                        copyButton: 'text-cyan-300 pb-0.5',
                      }}
                    >
                      Copy all ticket links
                    </Snippet>
                    <button
                      className="ml-1.5 p-1.5 text-cyan-300 border-1 border-green-500 rounded-xl"
                      onClick={() =>
                        navigator.share({
                          title: 'QRFlow Tickets',
                          text: steps.tickets
                            .map(
                              (ticket, id) =>
                                `#${id + 1 < 10 ? '0' : ''}${id + 1}` +
                                ': ' +
                                window.location.origin +
                                '/#/claim/' +
                                ticket
                            )
                            .join('\n'),
                        })
                      }
                    >
                      <FaShareFromSquare className="h-5 w-5 px-0.5 pb-0.5" />
                    </button>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 border-1 border-cyan-300 rounded-2xl">
                    <div className="flex flex-row items-center justify-center mb-2">
                      <Snippet
                        symbol={`#${currentTicket < 10 ? '0' : ''}${currentTicket}`}
                        variant="bordered"
                        codeString={
                          window.location.origin +
                          '/#/claim/' +
                          steps.tickets.at(currentTicket - 1)
                        }
                        classNames={{
                          base: 'w-52 pl-2 pr-1 py-0 gap-0 border-small border-amber-500',
                          symbol: 'text-cyan-300',
                          copyButton: 'text-cyan-300 pb-0.5',
                          pre: 'truncate',
                        }}
                      >
                        <a
                          href={
                            window.location.origin +
                            '/#/claim/' +
                            steps.tickets.at(currentTicket - 1)
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pl-1"
                        >
                          {`$GHO: ${data.amount / data.nbTickets}`}
                        </a>
                      </Snippet>
                      <button
                        className="ml-1.5 p-1.5 text-cyan-300 border-1 border-amber-500 rounded-xl"
                        onClick={() =>
                          navigator.share({
                            title:
                              'QRFlow Ticket ' +
                              `#${currentTicket < 10 ? '0' : ''}${currentTicket}`,
                            url:
                              window.location.origin +
                              '/#/claim/' +
                              steps.tickets.at(currentTicket - 1),
                          })
                        }
                      >
                        <FaShareFromSquare className="h-5 w-5 px-0.5 pb-0.5" />
                      </button>
                    </div>
                    <Button
                      variant="ghost"
                      color="warning"
                      onPress={onOpen}
                      className="border-1 w-full tracking-widest font-bold"
                    >
                      Open QR Code
                    </Button>
                    <Modal
                      isOpen={isOpen}
                      onClose={onClose}
                      placement="center"
                      classNames={{ base: 'm-2', closeButton: 'text-red-500' }}
                    >
                      <ModalContent>
                        {() => (
                          <>
                            <ModalHeader className="flex flex-row py-1.5 pl-4 pr-10 items-center">
                              <span className="text-xl text-cyan-300">{`#${currentTicket < 10 ? '0' : ''}${currentTicket}`}</span>
                            </ModalHeader>
                            <ModalBody className="bg-white p-3">
                              <QrSvg
                                value={
                                  window.location.origin +
                                  '/#/claim/' +
                                  steps.tickets.at(currentTicket - 1)
                                }
                                level="L"
                                margin={1}
                              />
                            </ModalBody>
                            <ModalFooter className="flex flex-row p-2 items-center justify-center">
                              <Pagination
                                loop
                                showControls
                                isCompact
                                size="sm"
                                color="success"
                                total={data.nbTickets}
                                page={currentTicket}
                                onChange={setCurrentTicket}
                              />
                            </ModalFooter>
                          </>
                        )}
                      </ModalContent>
                    </Modal>
                  </div>
                  <Pagination
                    loop
                    showControls
                    variant="faded"
                    size="sm"
                    color="success"
                    total={data.nbTickets}
                    page={currentTicket}
                    onChange={setCurrentTicket}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  )
}
