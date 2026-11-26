import { store } from '../store/store'

/** Top bar. Search and sort controls arrive in task 1.4b; the Import gate in Stage 3. */
export function Toolbar() {
  const n = store.rowCount.toLocaleString('en-US')
  return (
    <div className="toolbar">
      <span className="spacer" />
      <span className="hint">{n} rows</span>
      <button className="btn primary" disabled title="Available once every problem is resolved">
        Import
      </button>
    </div>
  )
}
