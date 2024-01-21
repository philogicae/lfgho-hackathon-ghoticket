import { Abi } from 'viem'
import registry from './registry.json'
import GhoTicket from './abis/GhoTicket.json'
import Gho from './abis/Gho.json'

const reg: {
  [contract: string]: {
    [chainId: string]: string
  }
} = registry

const abis: {
  [contract: string]: Abi
} = {
  GhoTicket: GhoTicket.abi as Abi,
  Gho: Gho.abi as Abi,
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
