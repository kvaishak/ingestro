import { useEffect, useRef } from 'react'
import { store } from './store/store'
import { useStoreVersion } from './store/useStore'
import { fetchCsv } from './store/fetchCsv'
import { FilePicker } from './ui/FilePicker'
import { LoadingBar } from './ui/LoadingBar'
import { Toolbar } from './ui/Toolbar'
import { Grid } from './ui/Grid'
import { IssuePanel } from './ui/IssuePanel'
import { Toast } from './ui/Toast'
import { undoLastChange } from './ui/actions'

export default function App() {
  useStoreVersion()
  const startedAt = useRef<number | null>(null)
  const { status, rowsLoaded } = store.loading

  // Dev/demo convenience: ?load=sample.csv fetches a file from /public on start.
  useEffect(() => {
    const name = new URLSearchParams(location.search).get('load')
    if (name && status === 'idle') fetchCsv(name)
  }, [status])

  if ((status === 'loading' || status === 'checking') && startedAt.current === null) startedAt.current = performance.now()
  const elapsed = status === 'done' && startedAt.current !== null ? (performance.now() - startedAt.current) / 1000 : null

  // Cmd/Ctrl+Z undoes the last change unless the user is typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.tagName === 'INPUT'
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault()
        undoLastChange()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (status === 'idle') return <div className="app"><FilePicker /></div>

  return (
    <div className="app">
      <LoadingBar />
      {status === 'done' && (
        <div className="loadingbar" data-testid="done">
          <span className="label">{rowsLoaded.toLocaleString('en-US')} rows loaded</span>
          {elapsed !== null && <span className="hint">in {elapsed.toFixed(1)} s</span>}
        </div>
      )}
      <div className="workspace">
        <IssuePanel />
        <div className="main">
          <Toolbar />
          <Grid />
        </div>
      </div>
      <Toast />
    </div>
  )
}
