'use client'
import {
  createContext,
  useReducer,
  useContext,
  useCallback,
  useRef,
} from 'react'
import { SnackbarType } from './snackbar/types'
import reducer, { Action } from './snackbar/reducer'
import Notification from './snackbar/SnackbarUI'

const useTrigger = () => {
  const trigger = useRef<boolean>(false)
  const setTrigger = (state: boolean) => {
    trigger.current = state
  }
  const wait = () => setTrigger(true)
  const done = () => setTrigger(false)
  return { trigger, wait, done, setTrigger }
}

const SnackbarContext = createContext<{
  queue: SnackbarType[]
  dispatch: React.Dispatch<Action>
}>({
  queue: [] as SnackbarType[],
  dispatch: () => {},
})

const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar was called outside Snackbar')
  }
  const { dispatch } = context
  const random = () => {
    return Math.floor(Math.random() * 100000).toString()
  }
  return useCallback(
    (snack: Omit<SnackbarType, 'key'>) => {
      dispatch({
        type: 'ADD_SNACKBAR',
        payload: { current: { ...snack, ...{ key: random() } } },
      })
    },
    [dispatch]
  )
}

export { useTrigger, useSnackbar }

export default function Snackbar({ children }: { children: React.ReactNode }) {
  const [{ queue }, dispatch] = useReducer(reducer, { queue: [] })
  return (
    <div
      id="snackbar-wrapper"
      className="relative flex flex-col w-full h-full overflow-hidden"
    >
      <SnackbarContext.Provider value={{ queue, dispatch }}>
        <div
          id="snackbar"
          className="absolute flex flex-col items-end justify-end w-full h-full pb-1 overflow-hidden pointer-events-none"
        >
          {queue.map((snack) => (
            <Notification
              key={snack.key}
              id={'notif-' + snack.key}
              type={snack.type}
              text={snack.text}
              link={snack.link}
              duration={snack.duration}
              trigger={snack.trigger}
              className={snack.className}
              onClose={() => {
                const singleSnack = document.getElementById(
                  'notif-' + snack.key
                )
                singleSnack!.style.transition = 'transform 0.4s ease'
                singleSnack!.style.transform = 'translateX(110%)'
                setTimeout(() => {
                  dispatch({
                    type: 'REMOVE_SNACKBAR',
                    payload: { key: snack.key },
                  })
                }, 440)
              }}
            />
          ))}
        </div>
        <div
          id="content"
          className="flex flex-col items-center w-full h-full overflow-y-auto"
        >
          {children}
        </div>
      </SnackbarContext.Provider>
    </div>
  )
}
