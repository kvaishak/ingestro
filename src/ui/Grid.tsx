import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { COLUMNS, COLUMN_LABEL, type Column } from '../validation/columns'
import { query, setQuery } from '../store/query'
import { setPanelMode } from './session'
import { store } from '../store/store'
import { useStoreVersion } from '../store/useStore'
import { Cell } from './Cell'
import { session, startEditing } from './session'

const ROW_HEIGHT = 32
const OVERSCAN = 10

function rowHasIssue(row: number): boolean {
  for (let c = 0; c < COLUMNS.length; c++) {
    if (store.flags[c][row] !== 0) return true
  }
  return false
}

/**
 * Virtualized grid. Reads row positions from store.view and never touches store.rows order.
 * Only the rows inside the viewport (plus OVERSCAN) exist in the DOM.
 */
export function Grid() {
  useStoreVersion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const count = store.view.length
  const ready = store.loading.status === 'done'

  // Header click cycles: ascending -> descending -> no sort. Ignored while loading.
  const onSort = (column: Column) => {
    if (!ready) return
    const cur = query.sort
    if (!cur || cur.column !== column) setQuery({ sort: { column, dir: 'asc' } })
    else if (cur.dir === 'asc') setQuery({ sort: { column, dir: 'desc' } })
    else setQuery({ sort: null })
  }

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  return (
    <div className="gridwrap" ref={scrollRef}>
      <div className="grid-header grid-cols">
        <div className="cell gutter" />
        {COLUMNS.map((c) => {
          const active = query.sort?.column === c
          const dir = active ? query.sort!.dir : null
          return (
            <button
              type="button"
              className={`cell th ${active ? 'active' : ''}`}
              key={c}
              disabled={!ready}
              onClick={() => onSort(c)}
              aria-sort={dir === 'asc' ? 'ascending' : dir === 'desc' ? 'descending' : 'none'}
              title={ready ? 'Click to sort' : 'Sorting is available once loading finishes'}
            >
              {COLUMN_LABEL[c]}
              <span className="arrow" aria-hidden="true">{dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : '⇅'}</span>
            </button>
          )
        })}
      </div>
      {count === 0 && ready && (
        <div className="grid-empty" data-testid="grid-empty">
          <p>No rows match this view.</p>
          {query.issueKey && (
            <button className="btn" onClick={() => { setPanelMode('detail'); setQuery({ issueKey: null }) }}>Show all rows</button>
          )}
        </div>
      )}
      <div className="grid-body" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = store.view[item.index]
          const hasIssue = rowHasIssue(row)
          const isEditingRow = session.editing?.row === row
          return (
            <div
              className={`grid-row grid-cols${isEditingRow ? ' editing' : ''}`}
              key={item.key}
              data-row={row}
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <div className="cell gutter">{hasIssue && <i className="dot" title="This row has a problem" />}</div>
              {COLUMNS.map((_, col) => (
                <div
                  key={col}
                  className="cellwrap"
                  tabIndex={0}
                  onDoubleClick={() => ready && startEditing(row, col)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && ready) startEditing(row, col) }}
                >
                  <Cell row={row} col={col} />
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
