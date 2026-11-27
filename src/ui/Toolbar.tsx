import { useEffect, useRef, useState } from 'react'
import { hasChanges } from '../store/changes'
import { revertEverything } from './actions'
import { ConfirmDialog } from './ConfirmDialog'
import { store } from '../store/store'
import { query, setQuery } from '../store/query'
import { issueByKey } from '../validation/catalog'
import { setPanelMode, showToast } from './session'

const DEBOUNCE_MS = 200

/** Top bar: search (debounced), row counts, Import placeholder. Sort lives in the grid's column headers. */
export function Toolbar() {
  const ready = store.loading.status === 'done'
  const [text, setText] = useState(query.search)
  const timer = useRef<number | null>(null)

  // Typing while a scan is pending replaces the pending scan; it never stacks.
  // Clearing the box applies immediately: an empty search restores the full list without a scan.
  const onChange = (value: string) => {
    setText(value)
    if (timer.current !== null) window.clearTimeout(timer.current)
    if (value.trim() === '') {
      timer.current = null
      setQuery({ search: '' })
      return
    }
    timer.current = window.setTimeout(() => {
      timer.current = null
      setQuery({ search: value })
    }, DEBOUNCE_MS)
  }

  useEffect(() => () => { if (timer.current !== null) window.clearTimeout(timer.current) }, [])

  const total = store.rowCount
  const shown = store.view.length
  const isNarrowed = Boolean(query.search || query.issueKey)
  const count = isNarrowed
    ? `${shown.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} rows`
    : `${total.toLocaleString('en-US')} rows`
  const activeIssue = query.issueKey ? issueByKey(query.issueKey) : null
  const canRevert = hasChanges()
  const [confirmingRevert, setConfirmingRevert] = useState(false)

  return (
    <div className="toolbar">
      <input
        type="search"
        className="search"
        placeholder={ready ? 'Search all columns…' : 'Search is available once loading finishes'}
        value={text}
        disabled={!ready}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Search all columns"
      />
      {activeIssue && (
        <span className="chip" data-testid="filterchip">
          Showing: {activeIssue.title}
          <button onClick={() => { setPanelMode('detail'); setQuery({ issueKey: null }) }} title="Show all rows" aria-label="Show all rows">✕</button>
        </span>
      )}
      <span className="spacer" />
      <span className="hint" data-testid="rowcount">{count}</span>
      {canRevert && (
        <button className="btn" onClick={() => setConfirmingRevert(true)} data-testid="revert-all">
          Revert all changes
        </button>
      )}
      {confirmingRevert && (
        <ConfirmDialog
          testId="confirm-revert"
          title="Revert all changes?"
          body="Every value you changed goes back to what was in the file. You can undo this afterwards."
          confirmLabel="Yes, revert everything"
          onCancel={() => setConfirmingRevert(false)}
          onConfirm={() => { setConfirmingRevert(false); revertEverything() }}
        />
      )}
      <button
        className="btn primary"
        disabled={!ready || store.problemCells > 0}
        title={store.problemCells > 0 ? `${store.problemCells.toLocaleString('en-US')} problems left` : 'Import'}
        onClick={() => showToast('Import is not part of this prototype. Everything is ready to go.', false)}
        data-testid="import"
      >
        Import
      </button>
    </div>
  )
}
