'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Error from '@components/frames/Error'

export default function Custom404() {
  const router = useRouter()
  useEffect(() => {
    if (!(window.location.pathname + window.location.hash).startsWith('/#/'))
      router.replace('/#/404')
  }, [])
  return <Error />
}
