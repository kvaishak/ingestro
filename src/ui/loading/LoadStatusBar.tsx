import { store } from '../../store/store'
import { formatCount } from '../../format'

/** The strip above the workspace: progress while loading, a summary when done, or the error. */
export function LoadStatusBar() {
  const { status, rowsLoaded, bytesRead, bytesTotal, message, seconds } = store.loading

  if (status === 'error') return <div className="error">Could not read the file: {message}</div>

  if (status === 'loading') {
    const pct = bytesTotal ? Math.min(100, (bytesRead / bytesTotal) * 100) : 0
    return (
      <div className="loadingbar" role="status" aria-live="polite">
        <span className="label">Loaded {formatCount(rowsLoaded)} rows…</span>
        <div className="progress"><i style={{ width: `${pct}%` }} /></div>
        <span className="hint">you can keep scrolling, nothing is blocked</span>
      </div>
    )
  }

  if (status === 'checking') {
    return (
      <div className="loadingbar" role="status" aria-live="polite">
        <span className="label">Loaded {formatCount(rowsLoaded)} rows. Checking for duplicates…</span>
        <div className="progress"><i style={{ width: '100%' }} /></div>
      </div>
    )
  }

  if (status === 'done') {
    return (
      <div className="loadingbar" data-testid="done">
        <span className="label">{formatCount(rowsLoaded)} rows loaded</span>
        {seconds !== undefined && <span className="hint">in {seconds.toFixed(1)} s</span>}
      </div>
    )
  }

  return null
}
