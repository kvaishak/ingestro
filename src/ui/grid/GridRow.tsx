import type { CSSProperties } from 'react'
import { COLUMNS } from '../../validation/columns'
import { isLoaded } from '../../store/store'
import { rowHasProblem } from '../../store/counts'
import { session, startEditing } from '../session'
import { Cell } from './Cell'

interface Props {
  /** Position in store.rows (not the position on screen). */
  row: number
  /** Absolute positioning from the virtualizer. */
  style: CSSProperties
}

/** One row: a red dot in the gutter when any cell has a problem, then one cell per column. */
export function GridRow({ row, style }: Props) {
  const ready = isLoaded()
  const isEditingRow = session.editing?.row === row
  return (
    <div className={`grid-row grid-cols${isEditingRow ? ' editing' : ''}`} data-row={row} style={style}>
      <div className="cell gutter">{rowHasProblem(row) && <i className="dot" title="This row has a problem" />}</div>
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
}
