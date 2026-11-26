import { columnIndex, type Column } from '../validation/columns'
import { store, positionsInFileOrder, bump } from './store'

export interface SortSpec {
  column: Column
  dir: 'asc' | 'desc'
}

export interface Query {
  /** Issue filter, used from Stage 2. */
  issueKey: string | null
  search: string
  sort: SortSpec | null
}

export const query: Query = { issueKey: null, search: '', sort: null }

export function resetQuery(): void {
  query.issueKey = null
  query.search = ''
  query.sort = null
}

const SPEND = columnIndex('monthly_spend')

/**
 * Builds the list of row positions the grid shows. Data never moves.
 * Pipeline: (issue filter, Stage 2) -> search -> sort. Filtering first means sorting fewer rows.
 */
export function buildView(): Uint32Array {
  const n = store.rowCount
  const rows = store.rows

  // 1. candidates: everything (issue filter and removed-row skip arrive in Stage 2)
  let positions: number[] | null = null

  // 2. search: case-insensitive substring over all 8 cells
  const needle = query.search.trim().toLowerCase()
  if (needle) {
    positions = []
    for (let i = 0; i < n; i++) {
      const r = rows[i]
      for (let c = 0; c < r.length; c++) {
        if (r[c].toLowerCase().includes(needle)) {
          positions.push(i)
          break
        }
      }
    }
  }

  // 3. sort the positions, never the rows
  const sort = query.sort
  if (sort) {
    if (!positions) positions = Array.from(positionsInFileOrder())
    const col = columnIndex(sort.column)
    const sign = sort.dir === 'asc' ? 1 : -1
    const cmp =
      col === SPEND
        ? (a: number, b: number) => sign * compareSpend(rows[a][col], rows[b][col])
        : (a: number, b: number) => sign * compareText(rows[a][col], rows[b][col])
    positions.sort(cmp)
  }

  return positions ? Uint32Array.from(positions) : positionsInFileOrder()
}

// Dictionary-style ordering: "pl" sorts next to "PL", "Müller" next to "Muller".
// Measured on 200k rows to cost the same as plain code-point compare (docs/perf-notes.md).
const collator = new Intl.Collator('en')
function compareText(a: string, b: string): number {
  return collator.compare(a, b)
}

/** Numeric when both sides parse as numbers, otherwise plain text compare; junk sorts as text. */
function compareSpend(a: string, b: string): number {
  const x = parseFloat(a)
  const y = parseFloat(b)
  const xn = Number.isFinite(x)
  const yn = Number.isFinite(y)
  if (xn && yn) return x - y
  if (xn !== yn) return xn ? -1 : 1 // numbers before non-numbers
  return compareText(a, b)
}

export function setQuery(patch: Partial<Query>): void {
  Object.assign(query, patch)
  store.view = buildView()
  bump()
}
