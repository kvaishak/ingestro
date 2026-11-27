import { COLUMNS, COLUMN_LABEL, type Column } from '../../validation/columns'
import { query } from '../../store/query'
import { isLoaded } from '../../store/store'
import { toggleSort } from '../actions'

type SortState = 'asc' | 'desc' | 'none'

const ARIA_SORT: Record<SortState, 'ascending' | 'descending' | 'none'> = {
  asc: 'ascending',
  desc: 'descending',
  none: 'none',
}

const SORT_ARROW: Record<SortState, string> = {
  asc: '▲',
  desc: '▼',
  none: '⇅',
}

function sortStateOf(column: Column): SortState {
  if (!query.sort || query.sort.column !== column) return 'none'
  return query.sort.dir
}

/** Column titles. Clicking one cycles its sort: ascending -> descending -> none. Disabled while loading. */
export function GridHeader() {
  const ready = isLoaded()
  return (
    <div className="grid-header grid-cols">
      <div className="cell gutter" />
      {COLUMNS.map((column) => {
        const sort = sortStateOf(column)
        return (
          <button
            type="button"
            className={`cell th ${sort !== 'none' ? 'active' : ''}`}
            key={column}
            disabled={!ready}
            onClick={() => toggleSort(column)}
            aria-sort={ARIA_SORT[sort]}
            title={ready ? 'Click to sort' : 'Sorting is available once loading finishes'}
          >
            {COLUMN_LABEL[column]}
            <span className="arrow" aria-hidden="true">{SORT_ARROW[sort]}</span>
          </button>
        )
      })}
    </div>
  )
}
