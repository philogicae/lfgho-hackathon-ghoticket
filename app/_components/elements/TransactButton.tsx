'use client'
import { TransactProps, useTransact } from '@components/hooks/Transact'
import { ClassName } from '@utils/tw'
import Button from '@components/elements/Button'

const TransactButton = ({
  chainId,
  contract,
  method,
  args,
  label,
  disabled,
  className,
}: TransactProps & {
  label: string
  disabled?: boolean
  className?: ClassName
}) => {
  const { send, transactLoading } = useTransact({
    chainId,
    contract,
    method,
    args,
  })
  return (
    <Button
      onClick={send}
      disabled={transactLoading || disabled}
      label={transactLoading ? 'Check Wallet' : label}
      className={className}
    />
  )
}

export { TransactButton }
