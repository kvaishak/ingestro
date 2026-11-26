import { COLUMNS, columnIndex } from '../validation/columns'
import { validateRow } from '../validation/rules'
import { markDuplicates } from '../validation/duplicates'
import { store, bump } from './store'
import { recount } from './counts'
import { pinRow, refreshView } from './query'

/**
 * The only code allowed to write a cell value.
 *
 * Every user action becomes one ChangeEntry (one cell for an edit, many for a bulk fix),
 * recorded before anything is written so it can be undone as a unit. Writing, undoing
 * and the housekeeping after both go through the same path (`writeCells`).
 */

export interface CellChange {
  row: number
  col: number
  oldValue: string
  newValue: string
}

export interface ChangeEntry {
  label: string
  cells: CellChange[]
  at: number
}

export const history: { undo: ChangeEntry[] } = { undo: [] }

/** The value each changed cell had when the file was loaded, keyed by cell. */
const originals = new Map<number, string>()
const cellKey = (row: number, col: number) => row * COLUMNS.length + col

const EMAIL = columnIndex('email')
const CUSTOMER_ID = columnIndex('customer_id')

export function applyChange(label: string, cells: { row: number; col: number; newValue: string }[]): ChangeEntry {
  const entry: ChangeEntry = {
    label,
    at: Date.now(),
    cells: cells.map((c) => ({ ...c, oldValue: store.rows[c.row][c.col] })),
  }
  history.undo.push(entry)
  writeCells(entry.cells.map((c) => ({ row: c.row, col: c.col, value: c.newValue })))
  return entry
}

export function undo(): ChangeEntry | undefined {
  const entry = history.undo.pop()
  if (!entry) return undefined
  writeCells(entry.cells.map((c) => ({ row: c.row, col: c.col, value: c.oldValue })))
  return entry
}

export function editCell(row: number, col: number, value: string): ChangeEntry {
  pinRow(row)
  return applyChange(`${COLUMNS[col]} for ${store.rows[row][0]}`, [{ row, col, newValue: value }])
}

export function originalValue(row: number, col: number): string | undefined {
  return originals.get(cellKey(row, col))
}

export function resetHistory(): void {
  history.undo = []
  originals.clear()
}

// ---- the shared write path ----

interface CellWrite {
  row: number
  col: number
  value: string
}

function writeCells(writes: CellWrite[]): void {
  for (const w of writes) {
    rememberOriginal(w.row, w.col)
    store.rows[w.row][w.col] = w.value
    store.changed[w.col][w.row] = w.value !== originals.get(cellKey(w.row, w.col)) ? 1 : 0
  }
  revalidate(writes)
  recount()
  refreshView()
  bump()
}

function rememberOriginal(row: number, col: number): void {
  const key = cellKey(row, col)
  if (!originals.has(key)) originals.set(key, store.rows[row][col])
}

/** Re-run the per-cell rules on every touched row; re-run the duplicate check only if it can matter. */
function revalidate(writes: CellWrite[]): void {
  const touchedRows = new Set(writes.map((w) => w.row))
  const codes = new Uint8Array(COLUMNS.length)
  for (const row of touchedRows) {
    validateRow(store.rows[row], codes)
    for (let c = 0; c < COLUMNS.length; c++) store.flags[c][row] = codes[c]
  }

  const touchedAKeyColumn = writes.some((w) => w.col === EMAIL || w.col === CUSTOMER_ID)
  if (touchedAKeyColumn) markDuplicates(store.rows, store.rowCount, store.flags, null)
}
