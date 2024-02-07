import { useEffect, useState } from 'react'
import {
  CovalentClient,
  ChainID,
  Response,
  BalancesResponse,
} from '@covalenthq/client-sdk'
import { Address } from 'viem'
import { useAccount } from 'wagmi'

if (!process.env.NEXT_PUBLIC_COLAVENT_ID)
  throw new Error('You need to provide NEXT_PUBLIC_BLASTAPI_ID env variable')
const client = new CovalentClient(process.env.NEXT_PUBLIC_COLAVENT_ID)

const fetchTokens = async (chainId: number, address: Address) => {
  return await client.BalanceService.getTokenBalancesForWalletAddress(
    chainId as ChainID,
    address,
    { noSpam: true, quoteCurrency: 'USD' }
  )
}

export const useTokenBalances = () => {
  const { isConnected, address, chainId } = useAccount()
  const [tokenBalances, setTokenBalances] = useState<
    BalancesResponse | undefined
  >()
  useEffect(() => {
    if (isConnected && address && chainId) {
      fetchTokens(chainId, address)
        .then((res: Response<BalancesResponse>) => setTokenBalances(res.data))
        .catch((err) => console.log(err))
    }
  }, [isConnected, address, chainId])
  return { tokenBalances }
}
