import { useSyncExternalStore } from 'react'
import { store, subscribe } from './store'

/** Re-renders the calling component whenever the store bumps its version. */
export function useStoreVersion(): number {
  return useSyncExternalStore(subscribe, () => store.version)
}
