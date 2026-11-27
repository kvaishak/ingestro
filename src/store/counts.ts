import { COLUMNS } from '../validation/columns'
import { issueFor } from '../validation/catalog'
import { store } from './store'

/**
 * Rebuild the problem counts from the flag overlays in one pass.
 * Cheap enough (1.6M byte reads for 200k rows, a few ms) to run after load and after every change,
 * so no incremental bookkeeping is needed.
 */
export function recount(): void {
  const counts = new Map<string, number>()
  let problemCells = 0
  let problemRows = 0

  for (let row = 0; row < store.rowCount; row++) {
    let hasProblem = false
    for (let c = 0; c < COLUMNS.length; c++) {
      const code = store.flags[c][row]
      if (code === 0) continue
      const issue = issueFor(COLUMNS[c], code)
      if (!issue) continue
      counts.set(issue.key, (counts.get(issue.key) ?? 0) + 1)
      problemCells++
      hasProblem = true
    }
    if (hasProblem) problemRows++
  }

  store.counts = counts
  store.problemCells = problemCells
  store.problemRows = problemRows
}

/** How many cells currently have this problem (0 when none). */
export function countOf(issueKey: string): number {
  return store.counts.get(issueKey) ?? 0
}

/** Does any cell in this row have a problem? */
export function rowHasProblem(row: number): boolean {
  for (let c = 0; c < COLUMNS.length; c++) {
    if (store.flags[c][row] !== 0) return true
  }
  return false
}
