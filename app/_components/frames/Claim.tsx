'use client'
import { useEffect, useState } from 'react'
import { cn } from '@utils/tw'
import { useContractRead } from 'wagmi'
import load from '@contracts/loader'
import Title from '@components/elements/Title'
import { FaRegMoneyBill1, FaLock, FaCircleNotch } from 'react-icons/fa6'
import { useParams } from 'react-router-dom'
import { extractFromTicketHash } from '@utils/packing'

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
  const [isLoading, setIsLoading] = useState(true)
  const decodeTicket = async (ticketCode: string) => {
    setTicket(await extractFromTicketHash(ticketCode))
  }
  const { data } = useContractRead({
    chainId: ticket.chainId,
    ...contract,
    functionName: 'isValid',
    args: [ticket.content],
    enabled: ticket.chainId > 0,
  })
  useEffect(() => {
    const result = data as keyof number
    if (result && (result[0] as string).length > 0) setIsLoading(false)
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
          !data ? 'w-full' : ''
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
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <span className="w-80 h-80 text-sm items-center justify-center text-center break-words p-2">
              {JSON.stringify(
                {
                  ...ticket.content,
                  signature: {
                    r: '0x' + ticket.content.signature?.r,
                    s: '0x' + ticket.content.signature?.s,
                    v: Number(ticket.content.signature?.v),
                  },
                },
                null,
                2
              )}
              <br />
              <br />
              {data
                ? JSON.stringify({
                    ticketId: (data as keyof number)[0] as string,
                    amount:
                      Number(
                        BigInt((data as keyof number)[1]) / BigInt(10 ** 10)
                      ) /
                      10 ** 8,
                    streamed: Boolean(BigInt((data as keyof number)[2])),
                  })
                : 'Invalid'}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
