const generatePermitOrder = ({
  chainId,
  contactAddr,
  typehash,
  creator,
  amount,
  deadline,
  streamed,
  orderId,
  orderSecret,
}: {
  chainId: number
  contactAddr: `0x${string}`
  typehash: `0x${string}`
  creator: `0x${string}`
  amount: bigint
  deadline: bigint
  streamed: number
  orderId: `0x${string}`
  orderSecret: `0x${string}`
}): any => {
  return {
    account: creator,
    domain: {
      name: 'GhoTicket',
      version: '1',
      chainId: chainId,
      verifyingContract: contactAddr,
    } as const,
    primaryType: 'PermitOrder',
    types: {
      PermitOrder: [
        { name: 'typehash', type: 'bytes32' },
        { name: 'creator', type: 'address' },
        { name: 'amount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'streamed', type: 'uint8' },
        { name: 'orderId', type: 'bytes32' },
        { name: 'orderSecret', type: 'bytes32' },
      ],
    } as const,
    message: {
      typehash: typehash,
      creator: creator,
      amount: amount,
      deadline: deadline,
      streamed: streamed,
      orderId: orderId,
      orderSecret: orderSecret,
    } as const,
  }
}

const generatePermitGho = ({
  chainId,
  contactAddr,
  typehash,
  owner,
  spender,
  value,
  nonce,
  deadline,
}: {
  chainId: number
  contactAddr: `0x${string}`
  typehash: `0x${string}`
  owner: `0x${string}`
  spender: `0x${string}`
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
    primaryType: 'PermitGho',
    types: {
      PermitGho: [
        { name: 'typehash', type: 'bytes32' },
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    } as const,
    message: {
      typehash: typehash,
      owner: owner,
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline,
    } as const,
  }
}

export { generatePermitOrder, generatePermitGho }
