'use client'

const names: Record<number, string> = {
  11155111: 'sepolia',
}

const ids: Record<string, number> = {
  sepolia: 11155111,
}

const blockscans: Record<number, string> = {
  11155111: 'https://sepolia.etherscan.io/tx/',
}

const toChainId = (chain: string) => {
  if (chain in ids) {
    return ids[chain]
  }
  return 0
}

const toChainName = (chainId: number | string) => {
  chainId = typeof chainId === 'number' ? chainId : parseInt(chainId)
  if (chainId in names) {
    return names[chainId]
  }
  return 'unknown'
}

const getBlockscan = (chainId: number | string) => {
  chainId = typeof chainId === 'number' ? chainId : parseInt(chainId)
  return blockscans[chainId]
}

export { toChainId, toChainName, getBlockscan }
