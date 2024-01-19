'use client'

const getBlockscan: { [chainId: number]: string } = {
  11155111: 'https://sepolia.etherscan.io/tx/',
}

const toChainName: { [chainId: number]: string } = {
  11155111: 'sepolia',
}

const toChainId: { [chainName: string]: number } = Object.fromEntries(
  Object.entries(toChainName).map(([k, v]) => [v, parseInt(k)])
)

export { toChainId, toChainName, getBlockscan }
