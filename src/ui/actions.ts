/**
 * Every user action that changes something: the data, the filter/sort/search, or what the panel shows.
 *
 * Once a file is loaded, components READ from `store`, `query` and `session`, and CHANGE things
 * only by calling a function here. That keeps the rules in one file: e.g. "picking a problem always
 * opens its detail view". Two exceptions: loading a file goes through store/load.ts, and opening/closing
 * the cell editor or dismissing the toast are plain setters in session.ts.
 */
import { COLUMN_LABEL, COLUMNS, type Column } from '../validation/columns'
import { editCell, undo, revertAllChanges } from '../store/changes'
import { applyBulk, type BulkPlan } from '../store/bulk'
import { query, setQuery, nextSort } from '../store/query'
import { store, customerIdOf } from '../store/store'
import { formatCount } from '../format'
import { showToast, setPanelMode } from './session'

// ---- what the grid shows ----

/** Filter the grid to one problem and show its explanation. */
export function selectIssue(issueKey: string): void {
  setPanelMode('detail')
  setQuery({ issueKey })
}

/** Show every row again and go back to the list of all problems. */
export function clearIssueFilter(): void {
  // With no problem selected the panel shows the list; resetting the mode means the next
  // problem picked opens on its detail view, not on a leftover preview or result.
  setPanelMode('detail')
  setQuery({ issueKey: null })
}

export function toggleSort(column: Column): void {
  setQuery({ sort: nextSort(query.sort, column) })
}

export function setSearch(text: string): void {
  setQuery({ search: text })
}

// ---- the bulk fix flow: detail -> preview -> applied ----

export function openBulkPreview(): void {
  setPanelMode('preview')
}

export function closeBulkPreview(): void {
  setPanelMode('detail')
}

export function applyBulkPlan(plan: BulkPlan): void {
  const entry = applyBulk(plan)
  if (!entry) return
  setPanelMode('applied', { changed: plan.total })
  showToast(`Changed ${formatCount(plan.total)} values`, true)
}

// ---- editing and undo ----

export function saveCell(row: number, col: number, value: string): void {
  if (store.rows[row][col] === value) return
  editCell(row, col, value)
  showToast(`Changed ${COLUMN_LABEL[COLUMNS[col]].toLowerCase()} for ${customerIdOf(row)}`, true)
}

export function undoLastChange(): void {
  const entry = undo()
  if (!entry) return
  setPanelMode('detail')
  showToast(`Undone: ${entry.label}`, false)
}

export function revertEverything(): void {
  const entry = revertAllChanges()
  if (!entry) return
  setPanelMode('detail')
  showToast(entry.label, true)
}

// ---- import ----

export function startImport(): void {
  showToast('Import is not part of this prototype. Everything is ready to go.', false)
}
