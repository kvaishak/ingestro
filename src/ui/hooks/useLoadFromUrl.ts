import { useEffect } from 'react'
import { fetchCsv } from '../../store/load'
import { store } from '../../store/store'

/** Dev/demo convenience: ?load=sample.csv fetches that file from /public on start. */
export function useLoadFromUrl(): void {
  const status = store.loading.status
  useEffect(() => {
    const name = new URLSearchParams(location.search).get('load')
    if (name && status === 'idle') fetchCsv(name)
  }, [status])
}
