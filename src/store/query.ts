import { columnIndex, type Column } from '../validation/columns'
import { issueByKey } from '../validation/catalog'
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
 * Pipeline: issue filter -> search -> sort. Each step narrows, so the next one has less to do.
 * `positions === null` means "every row" and lets the cheap case skip allocating a list.
 */
export function buildView(): Uint32Array {
  let positions: number[] | null = null

  if (query.issueKey) positions = rowsWithIssue(query.issueKey)

  const needle = query.search.trim().toLowerCase()
  if (needle) positions = rowsMatchingSearch(needle, positions)

  const sort = query.sort
  if (sort) {
    if (!positions) positions = Array.from(positionsInFileOrder())
    const rows = store.rows
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

/** Rows whose cell in the issue's column carries exactly that issue code. */
function rowsWithIssue(issueKey: string): number[] {
  const issue = issueByKey(issueKey)
  const columnFlags = store.flags[columnIndex(issue.column)]
  const positions: number[] = []
  for (let i = 0; i < store.rowCount; i++) {
    if (columnFlags[i] === issue.code) positions.push(i)
  }
  return positions
}

/** Case-insensitive substring match over all 8 cells, over the given candidates (or every row). */
function rowsMatchingSearch(needle: string, candidates: number[] | null): number[] {
  const rows = store.rows
  const matches: number[] = []
  const count = candidates ? candidates.length : store.rowCount
  for (let k = 0; k < count; k++) {
    const i = candidates ? candidates[k] : k
    if (rowContains(rows[i], needle)) matches.push(i)
  }
  return matches
}

function rowContains(row: string[], needle: string): boolean {
  for (let c = 0; c < row.length; c++) {
    if (row[c].toLowerCase().includes(needle)) return true
  }
  return false
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
