'use client'

import Button from '@components/elements/Button'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaRotateRight } from 'react-icons/fa6'
import { ReactNode } from 'react'
import { ClassName, cn } from '@utils/tw'

export default function Title({
  label,
  logo,
  loading,
  ready,
  onClick,
}: {
  label: string
  logo: ReactNode
  loading?: boolean
  ready?: ClassName
  onClick?: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-row items-center">
      <Button
        className={'w-20 h-8'}
        label={
          <div className="text-sm flex flex-row items-center justify-center">
            <FaArrowLeft />
            <span className="pl-2">BACK</span>
          </div>
        }
        onClick={() => navigate('/')}
      />
      <Button
        label={label}
        disabled={true}
        className={'mx-3 bg-indigo-700 w-44 text-md font-semibold'}
      />
      <Button
        className={cn('w-20 h-8 text-xl text-cyan-300', ready)}
        disabled={!ready || loading}
        label={!loading ? logo : <FaRotateRight className="animate-spin" />}
        onClick={onClick}
      />
    </div>
  )
}
