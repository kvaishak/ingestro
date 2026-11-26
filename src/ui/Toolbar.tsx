import { useEffect, useRef, useState } from 'react'
import { store } from '../store/store'
import { query, setQuery } from '../store/query'

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
  const count = query.search && shown !== total
    ? `${shown.toLocaleString('en-US')} of ${total.toLocaleString('en-US')} rows`
    : `${total.toLocaleString('en-US')} rows`

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
      <span className="spacer" />
      <span className="hint" data-testid="rowcount">{count}</span>
      <button className="btn primary" disabled title="Available once every problem is resolved">
        Import
      </button>
    </div>
  )
}
