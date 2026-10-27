import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { kvGet, kvSet } from '@/data/kv'
import { type AppState, emptyState, STATE_KEY, withDefaults } from './state'
import { StoreContext } from './store'

/** Reads the state from the device once, and saves it after every change. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(emptyState)
  const [ready, setReady] = useState(false)
  const latest = useRef(state)

  useEffect(() => {
    void kvGet<unknown>(STATE_KEY).then((saved) => {
      latest.current = withDefaults(saved)
      setState(latest.current)
      setReady(true)
    })
  }, [])

  const save = useCallback((next: AppState) => {
    latest.current = { ...next, updatedAt: Date.now() }
    setState(latest.current)
    void kvSet(STATE_KEY, latest.current)
  }, [])
  const update = useCallback((change: (s: AppState) => AppState) => save(change(latest.current)), [save])
  const replace = useCallback((s: AppState) => save(withDefaults(s)), [save])

  return <StoreContext.Provider value={{ state, ready, update, replace }}>{children}</StoreContext.Provider>
}
