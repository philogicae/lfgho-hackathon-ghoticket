import { Address, Hex } from 'viem'

const generateTicketPermit = ({
  chainId,
  contactAddr,
  creator,
  orderId,
  orderSecret,
}: {
  chainId: number
  contactAddr: Address
  creator: Address
  orderId: Hex
  orderSecret: Hex
}): any => {
  return {
    account: creator,
    domain: {
      name: 'GhoTicket',
      version: '1',
      chainId: chainId,
      verifyingContract: contactAddr,
    } as const,
    primaryType: 'TicketPermit',
    types: {
      TicketPermit: [
        { name: 'creator', type: 'address' },
        { name: 'orderId', type: 'bytes32' },
        { name: 'orderSecret', type: 'bytes32' },
      ],
    } as const,
    message: {
      creator: creator,
      orderId: orderId,
      orderSecret: orderSecret,
    } as const,
  }
}

const generateGhoPermit = ({
  chainId,
  contactAddr,
  owner,
  spender,
  value,
  nonce,
  deadline,
}: {
  chainId: number
  contactAddr: Address
  owner: Address
  spender: Address
  value: bigint
  nonce: bigint
  deadline: bigint
}): any => {
  return {
    account: owner,
    domain: {
      name: 'Gho Token',
      version: '1',
      chainId: chainId,
      verifyingContract: contactAddr,
    } as const,
    primaryType: 'Permit',
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const,
    message: {
      owner: owner,
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline,
    } as const,
  }
}

export { generateTicketPermit, generateGhoPermit }
