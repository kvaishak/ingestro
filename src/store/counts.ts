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
    let rowHasProblem = false
    for (let c = 0; c < COLUMNS.length; c++) {
      const code = store.flags[c][row]
      if (code === 0) continue
      const issue = issueFor(COLUMNS[c], code)
      if (!issue) continue
      counts.set(issue.key, (counts.get(issue.key) ?? 0) + 1)
      problemCells++
      rowHasProblem = true
    }
    if (rowHasProblem) problemRows++
  }

  store.counts = counts
  store.problemCells = problemCells
  store.problemRows = problemRows
}
