/** The few user actions that touch data, each pairing the store call with its feedback. */
import { COLUMN_LABEL, COLUMNS } from '../validation/columns'
import { editCell, undo, revertAllChanges } from '../store/changes'
import { store } from '../store/store'
import { showToast, setPanelMode } from './session'
import { applyBulk, type BulkPlan } from '../store/bulk'

export function saveCell(row: number, col: number, value: string): void {
  if (store.rows[row][col] === value) return
  editCell(row, col, value)
  showToast(`Changed ${COLUMN_LABEL[COLUMNS[col]].toLowerCase()} for ${store.rows[row][0]}`, true)
}

export function undoLastChange(): void {
  const entry = undo()
  if (!entry) return
  setPanelMode('detail')
  showToast(`Undone: ${entry.label}`, false)
}

export function applyBulkPlan(plan: BulkPlan): void {
  const entry = applyBulk(plan)
  if (!entry) return
  setPanelMode('applied', { changed: plan.total })
  showToast(`Changed ${plan.total.toLocaleString('en-US')} values`, true)
}

export function revertEverything(): void {
  const entry = revertAllChanges()
  if (!entry) return
  setPanelMode('detail')
  showToast(entry.label, true)
}
