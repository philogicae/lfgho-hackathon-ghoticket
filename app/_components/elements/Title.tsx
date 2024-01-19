import Button from '@components/elements/Button'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft } from 'react-icons/fa6'
import { ReactNode } from 'react'

export default function Title({
  label,
  logo,
}: {
  label: string
  logo: ReactNode
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
        className={'mx-3 bg-blue-800 w-44 text-md'}
      />
      <Button
        className={'w-20 h-8 text-xl text-cyan-300'}
        disabled={true}
        label={logo}
      />
    </div>
  )
}
