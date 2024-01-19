import { Abi } from 'viem'
import registry from './registry.json'
import ATM from './abis/ATM.json'

const reg: {
  [contract: string]: {
    [chainId: string]: string
  }
} = registry

const abis: {
  [contract: string]: Abi
} = {
  ATM: ATM.abi as Abi,
}

export type ContractData = {
  address: `0x${string}`
  abi: Abi
}

const load = (contract: string, chainId: number): ContractData | undefined => {
  const chain = chainId.toString()
  if (reg?.[contract][chain] && abis[contract])
    return {
      address: reg[contract][chain] as `0x${string}`,
      abi: abis[contract],
    }
}

export default load
