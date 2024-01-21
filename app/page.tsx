'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createHashRouter, RouterProvider, redirect } from 'react-router-dom'
import Welcome from '@components/frames/Welcome'
import Send from '@components/frames/Send'
import Claim from '@components/frames/Claim'
import Track from '@components/frames/Track'
import Error from '@components/frames/Error'
import Loading from '@components/frames/Loading'

export default function Home() {
  const router = useRouter()
  useEffect(() => {
    if (window.location.pathname + window.location.hash === '/')
      router.replace('/#/')
  }, [])
  const hashRouter = createHashRouter([
    { path: '', element: <Welcome /> },
    { path: 'send', element: <Send /> },
    { path: 'claim', element: <Claim /> },
    { path: 'claim/:data', element: <Claim /> },
    { path: 'track', element: <Track /> },
    { path: 'track/:addr', element: <Track /> },
    { path: '404', element: <Error /> },
    { path: '*', loader: async () => redirect('404') },
  ])
  return (
    <RouterProvider
      router={hashRouter}
      fallbackElement={<Loading />}
      future={{ v7_startTransition: true }}
    />
  )
}
