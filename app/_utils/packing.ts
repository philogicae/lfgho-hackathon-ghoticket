import { Hex, hexToSignature, Signature } from 'viem'
import { compress, decompress } from '@zalari/string-compression-utils'

const generateTicketHash = async (
  chainId: number,
  orderId: Hex,
  orderSecret: Hex,
  ticketSecret: Hex,
  signature: Hex
): Promise<string> => {
  const raw =
    chainId.toString() +
    ':' +
    orderId.slice(2) +
    orderSecret.slice(2) +
    ticketSecret.slice(2) +
    signature.slice(2)
  const compressed = await compress(raw, 'deflate-raw')
  const ticketCode = encodeURIComponent(compressed)
  return ticketCode
}

const generateBatchTicketHash = async (
  chainId: number,
  orderId: Hex,
  orderSecret: Hex,
  ticketSecrets: Hex[],
  signature: Hex
): Promise<string[]> =>
  await Promise.all(
    ticketSecrets.map(
      async (ticketSecret) =>
        await generateTicketHash(
          chainId,
          orderId,
          orderSecret,
          ticketSecret,
          signature
        )
    )
  )

const extractFromTicketHash = async (
  ticketCode: string
): Promise<{
  chainId: number
  content: {
    orderId: Hex
    orderSecret: Hex
    ticketSecret: Hex
    signature: Signature
  }
}> => {
  const decoded = decodeURIComponent(ticketCode)
  const output = await decompress(decoded, 'deflate-raw')
  const chainId = Number(output.split(':')[0])
  const data = output.split(':')[1]
  const orderId = ('0x' + data.slice(0, 64)) as `0x${string}`
  const orderSecret = ('0x' + data.slice(64, 128)) as `0x${string}`
  const ticketSecret = ('0x' + data.slice(128, 192)) as `0x${string}`
  const signature = hexToSignature(('0x' + data.slice(192)) as `0x${string}`)
  return {
    chainId,
    content: {
      orderId,
      orderSecret,
      ticketSecret,
      signature,
    },
  }
}

export { generateBatchTicketHash, extractFromTicketHash }
