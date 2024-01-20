import { FaWallet } from 'react-icons/fa6'

export default function PleaseConnect({ chain }: { chain?: string }) {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full mb-10">
      <FaWallet className="mb-4 text-6xl" />
      <span className="text-xl font-bold w-48 text-center">
        Wallet Not Connected
      </span>
    </div>
  )
}
