'use client'

import Title from '@components/elements/Title'
import { FaRegMoneyBill1 } from 'react-icons/fa6'

export default function Claim() {
  return (
    <>
      <Title
        label="Claim Ticket"
        logo={<FaRegMoneyBill1 className="text-3xl" />}
      />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 "></div>
    </>
  )
}
