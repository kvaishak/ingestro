/** The few user actions that touch data, each pairing the store call with its feedback. */
import { COLUMN_LABEL, COLUMNS } from '../validation/columns'
import { editCell, undo } from '../store/changes'
import { store } from '../store/store'
import { showToast } from './session'

export function saveCell(row: number, col: number, value: string): void {
  if (store.rows[row][col] === value) return
  editCell(row, col, value)
  showToast(`Changed ${COLUMN_LABEL[COLUMNS[col]].toLowerCase()} for ${store.rows[row][0]}`, true)
}

export function undoLastChange(): void {
  const entry = undo()
  if (!entry) return
  showToast(`Undone: ${entry.label}`, false)
}
