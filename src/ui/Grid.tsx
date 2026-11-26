import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { COLUMNS, COLUMN_LABEL } from '../validation/columns'
import { store } from '../store/store'
import { useStoreVersion } from '../store/useStore'
import { Cell } from './Cell'

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
      <div className="grid-header grid-cols">
        <div className="cell gutter" />
        {COLUMNS.map((c) => (
          <div className="cell" key={c}>{COLUMN_LABEL[c]}</div>
        ))}
      </div>
      <div className="grid-body" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = store.view[item.index]
          return (
            <div
              className="grid-row grid-cols"
              key={item.key}
              data-row={row}
              style={{ transform: `translateY(${item.start}px)` }}
            >
              <div className="cell gutter" />
              {COLUMNS.map((_, col) => (
                <Cell row={row} col={col} key={col} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
