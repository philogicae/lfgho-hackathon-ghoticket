'use client'
import Button from '@components/elements/Button'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaWallet } from 'react-icons/fa6'
import { ReactNode } from 'react'
import { cn } from '@utils/tw'

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
  ready?: boolean
  onClick?: () => void
}) {
  const navigate = useNavigate()
  return (
    <div className="flex flex-row items-center">
      <Button
        className={'w-20 h-8 ml-1'}
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
        className={'ml-2.5 mr-2 bg-indigo-700 w-40 text-md font-extrabold'}
      />
      <div className="overflow-hidden rounded-lg">
        <div
          className={cn(
            'relative z-10 border-3 border-transparent',
            ready ? 'rainbow-button cursor-pointer' : '',
            loading ? 'loading-button cursor-not-allowed' : ''
          )}
        >
          <Button
            className={cn('w-20 h-8 text-lg')}
            disabled={!ready || loading}
            label={!loading ? logo : <FaWallet />}
            onClick={onClick}
          />
        </div>
      </div>
    </div>
  )
}
