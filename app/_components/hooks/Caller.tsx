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
  const methods: { [method: string]: number } = {}
  calls
    .map((x) => x.functionName)
    .forEach((name) => {
      methods[name] = (methods[name] || 0) + 1
    })
  const reads = useReadContracts({
    contracts: calls.map((x) => ({
      chainId: x.chainId,
      ...x.contract,
      functionName: x.functionName,
      args: x.args,
    })),
    query: {
      enabled: active,
      select: (data) => {
        const result: { [method: string]: any } = {}
        ;(data && data.length
          ? data.map((x, i) => {
              const field = initData[i]
              return x.status === 'success'
                ? (x.result as typeof field)
                : initData[i]
            })
          : initData
        ).forEach((x: any, i: number) => {
          result[calls[i].functionName] =
            methods[calls[i].functionName] > 1
              ? [...(result[calls[i].functionName] || []), x]
              : x
        })
        return result
      },
    },
  })
  return {
    result: reads.data!,
    fetch: reads.refetch,
    isLoading: reads.isLoading,
    isSuccess: reads.isSuccess,
    isError: reads.isError,
  }
}

export { useCall }
