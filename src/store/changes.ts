import { COLUMNS } from '../validation/columns'
import { validateRow } from '../validation/rules'
import { markDuplicates, isDuplicateChecked } from '../validation/duplicates'
import { store, bump, customerIdOf } from './store'
import { recount } from './counts'
import { pinRow, refreshView } from './query'
import { formatCount } from '../format'

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

/**
 * The value each changed cell had when the file was loaded, keyed by cell.
 * This is the only record of what the user changed: isChanged, originalValue, hasChanges and
 * revertAllChanges all read from it.
 */
const originals = new Map<number, string>()
const cellKey = (row: number, col: number) => row * COLUMNS.length + col
const cellFromKey = (key: number) => ({ row: Math.floor(key / COLUMNS.length), col: key % COLUMNS.length })

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
  return applyChange(`${COLUMNS[col]} for ${customerIdOf(row)}`, [{ row, col, newValue: value }])
}

/** Does this cell differ from the value it had in the file? Editing it back by hand makes it false again. */
export function isChanged(row: number, col: number): boolean {
  const original = originals.get(cellKey(row, col))
  if (original === undefined) return false
  return store.rows[row][col] !== original
}

export function originalValue(row: number, col: number): string | undefined {
  return originals.get(cellKey(row, col))
}

/** Does any cell currently differ from the value that was loaded? Stops at the first one. */
export function hasChanges(): boolean {
  for (const key of originals.keys()) {
    const { row, col } = cellFromKey(key)
    if (isChanged(row, col)) return true
  }
  return false
}

/**
 * Put every changed cell back to its loaded value, as ONE change: one housekeeping pass instead of
 * one per history entry, and the revert itself can be undone. Cells edited back by hand are skipped.
 */
export function revertAllChanges(): ChangeEntry | undefined {
  const cells: { row: number; col: number; newValue: string }[] = []
  for (const [key, original] of originals) {
    const { row, col } = cellFromKey(key)
    if (isChanged(row, col)) cells.push({ row, col, newValue: original })
  }
  if (cells.length === 0) return undefined
  return applyChange(`Reverted ${formatCount(cells.length)} changes`, cells)
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

  const touchedACheckedColumn = writes.some((w) => isDuplicateChecked(w.col))
  if (touchedACheckedColumn) markDuplicates(store.rows, store.rowCount, store.flags)
}
