'use client'
import { ContractData } from '@contracts/loader'
import { useReadContracts } from 'wagmi'

type Call = {
  chainId?: number
  contract: ContractData
  functionName: string
  args?: readonly unknown[]
}

type CallsProps = {
  calls: Call[]
  initData: any[]
  active?: boolean
}

const useCall = ({ calls, initData, active = false }: CallsProps) => {
  const reads = useReadContracts({
    contracts: calls.map((x) => ({
      chainId: x.chainId,
      ...x.contract,
      functionName: x.functionName,
      args: x.args,
    })),
    query: {
      enabled: active,
      select: (data) =>
        Object.assign(
          {},
          ...(data && data.length
            ? data.map((x, i) => {
                const field = initData[i]
                return x.status === 'success'
                  ? (x.result as typeof field)
                  : initData[i]
              })
            : initData
          ).map((x, i) => ({ [calls[i].functionName]: x }))
        ),
    },
  })
  return {
    result: reads.data,
    fetch: reads.refetch,
    isLoading: reads.isLoading,
    isSuccess: reads.isSuccess,
    isError: reads.isError,
  }
}

export { useCall }
