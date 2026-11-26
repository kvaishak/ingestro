import { store } from '../store/store'

const fmt = (n: number) => n.toLocaleString('en-US')

export function LoadingBar() {
  const { status, rowsLoaded, bytesRead, bytesTotal, message } = store.loading
  if (status === 'error') return <div className="error">Could not read the file: {message}</div>
  if (status !== 'loading') return null
  const pct = bytesTotal ? Math.min(100, (bytesRead / bytesTotal) * 100) : 0
  return (
    <div className="loadingbar" role="status" aria-live="polite">
      <span className="label">Loaded {fmt(rowsLoaded)} rows…</span>
      <div className="progress"><i style={{ width: `${pct}%` }} /></div>
      <span className="hint">you can keep scrolling, nothing is blocked</span>
    </div>
  )
}
