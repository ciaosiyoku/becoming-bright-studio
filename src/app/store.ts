import { createContext, useContext } from 'react'
import type { AppState } from './state'

// The app state for every screen (provided by StoreProvider.tsx): read once from the device, saved after every
// change, under one key.

export interface Store {
  state: AppState
  ready: boolean
  /** Changes the state: `change` gets the current one and returns the new one. updatedAt is set here. */
  update: (change: (s: AppState) => AppState) => void
  /** Replaces everything (restore from a backup). */
  replace: (s: AppState) => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore(): Store {
  const s = useContext(StoreContext)
  if (!s) throw new Error('useStore outside StoreProvider')
  return s
}
