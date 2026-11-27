import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { query } from '../../store/query'
import { store, isLoaded } from '../../store/store'
import { useStoreVersion } from '../../store/useStore'
import { clearIssueFilter } from '../actions'
import { GridHeader } from './GridHeader'
import { GridRow } from './GridRow'

/** Pixel height of every row. Must match --row-h in styles.css. */
const ROW_HEIGHT = 32
const OVERSCAN = 10

/**
 * Virtualized grid. Reads row positions from store.view and never touches store.rows order.
 * Only the rows inside the viewport (plus OVERSCAN) exist in the DOM.
 */
export function Grid() {
  useStoreVersion()
  const scrollRef = useRef<HTMLDivElement>(null)
  const count = store.view.length

  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })

  return (
    <div className="gridwrap" ref={scrollRef}>
      <GridHeader />
      {count === 0 && isLoaded() && <EmptyView />}
      <div className="grid-body" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => (
          <GridRow key={item.key} row={store.view[item.index]} style={{ transform: `translateY(${item.start}px)` }} />
        ))}
      </div>
    </div>
  )
}

function EmptyView() {
  return (
    <div className="grid-empty" data-testid="grid-empty">
      <p>No rows match this view.</p>
      {query.issueKey && <button className="btn" onClick={clearIssueFilter}>Show all rows</button>}
    </div>
  )
}
