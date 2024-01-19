'use client'

import Button from '@components/elements/Button'
import Title from '@components/elements/Title'
import { useSnackbar } from '@layout/Snackbar'
import { FaRegPaperPlane } from 'react-icons/fa6'

export default function Send() {
  const addSnackbar = useSnackbar()
  return (
    <>
      <Title label="Send Ticket[s]" logo={<FaRegPaperPlane />} />
      <div className="flex flex-col w-full h-full border border-cyan-400 mt-2 items-center justify-between">
        <br />
        <Button
          label="Test success"
          onClick={() =>
            addSnackbar({
              type: 'success',
              text: 'Transaction confirmed',
            })
          }
        />
        <Button
          label="Test error"
          onClick={() =>
            addSnackbar({
              type: 'error',
              text: 'Transaction failed',
            })
          }
        />
        <Button
          label="Test info"
          onClick={() =>
            addSnackbar({
              type: 'info',
              text: 'Transaction submitted',
              link: 'https://google.com',
            })
          }
        />
        <Button
          label="Test warning"
          onClick={() =>
            addSnackbar({
              type: 'warning',
              text: 'Transaction may fail',
            })
          }
        />
        <br />
      </div>
    </>
  )
}
