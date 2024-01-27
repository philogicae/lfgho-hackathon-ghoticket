'use client'
import { useEffect, useState } from 'react'
import { cn } from '@utils/tw'
import { useModal } from 'connectkit'
import { useChainId, useAccount, useContractRead } from 'wagmi'
import load from '@contracts/loader'
//import { useTransact } from '@components/hooks/Transact'
import WrongChain from '@components/elements/WrongChain'
import PleaseConnect from '@components/elements/PleaseConnect'
import Title from '@components/elements/Title'
import { FaRegMoneyBill1, FaWandMagicSparkles } from 'react-icons/fa6'
import { useParams } from 'react-router-dom'
import { extractFromTicketHash } from '@utils/packing'

export default function Claim() {
  const { data } = useParams()
  const [chainId, setChainId] = useState(0)
  const [ticket, setTicket] = useState({
    orderId: '',
    orderSecret: '',
    ticketSecret: '',
    signature: { v: BigInt(0), r: '' as `0x${string}`, s: '' as `0x${string}` },
  })
  const { isConnected } = useAccount()
  const { setOpen, openSwitchNetworks } = useModal()
  const selectedChainId = useChainId()
  const contract = load('QRFlow', chainId)
  //const [isLoading, setIsLoading] = useState(false)
  const decodeTicket = async (ticketHash: string) => {
    const decoded = await extractFromTicketHash(ticketHash)
    setChainId(decoded[0])
    setTicket(decoded[1])
  }
  const { data: content } = useContractRead({
    chainId: selectedChainId,
    ...contract,
    functionName: 'isValid',
    args: [ticket],
    enabled: chainId > 0,
  })
  useEffect(() => {
    if (data) decodeTicket(data)
  }, [])
  useEffect(() => {
    if (isConnected && !contract) openSwitchNetworks()
  }, [isConnected && selectedChainId])
  useEffect(() => {
    if (!isConnected) setOpen(true)
  }, [])
  return (
    <>
      <Title
        label="Claim Ticket"
        logo={<FaRegMoneyBill1 className="text-3xl" />}
      />
      <div
        className={cn(
          'flex flex-col h-full min-w-[320px] max-w-[700px] border border-cyan-400 mt-2 items-center justify-start overflow-hidden rounded-xl',
          !isConnected || !contract ? 'w-full' : ''
        )}
      >
        {!isConnected ? (
          <PleaseConnect />
        ) : !contract ? (
          <WrongChain />
        ) : !data ? (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <FaWandMagicSparkles className="text-6xl" />
            <span className="m-3 text-3xl font-bold text-center">
              Not ready yet
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center w-full h-full">
            <span className="w-80 h-80 text-sm items-center justify-center break-words">
              {JSON.stringify(
                {
                  ...ticket,
                  signature: {
                    r: '0x' + ticket.signature?.r,
                    s: '0x' + ticket.signature?.s,
                    v: Number(ticket.signature?.v),
                  },
                },
                null,
                2
              )}
              <br />
              <br />
              {content
                ? JSON.stringify({
                    ticketId: (content as keyof number)[0] as string,
                    amount:
                      Number(
                        BigInt((content as keyof number)[1]) / BigInt(10 ** 10)
                      ) /
                      10 ** 8,
                    streamed: Boolean(BigInt((content as keyof number)[2])),
                  })
                : 'Invalid'}
            </span>
          </div>
        )}
      </div>
    </>
  )
}
