'use client'

import Title from '@components/elements/Title'
import { FaMagnifyingGlass } from 'react-icons/fa6'

export default function Track() {
  return (
    <>
      <Title
        label="Tracking"
        logo={<FaMagnifyingGlass className="transform -scale-x-100" />}
      />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 "></div>
    </>
  )
}
