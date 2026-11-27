import { columnIndex, type Column } from '../validation/columns'
import { issueByKey } from '../validation/catalog'
import { applyChange, type ChangeEntry } from './changes'
import { splitBySuggestion, type UnrecognisedSpelling } from './suggestions'

/**
 * The bulk fix: every recognised value of one problem type, applied as a single change.
 * planBulk() describes what would happen (for the preview); applyBulk() does it through the
 * change engine, so it is one undo step and every touched row is revalidated and recounted.
 * Rows are not pinned: after the fix the filtered grid should show only what is left.
 */

export interface BulkGroup {
  from: string
  to: string
  rows: number[]
}

export interface BulkPlan {
  issueKey: string
  column: Column
  /** One line per distinct "from -> to", biggest first. */
  groups: BulkGroup[]
  total: number
  untouched: UnrecognisedSpelling[]
  untouchedTotal: number
}

export function planBulk(issueKey: string): BulkPlan {
  const issue = issueByKey(issueKey)
  const split = splitBySuggestion(issueKey)

  const groupsByKey = new Map<string, BulkGroup>()
  for (const { row, value, suggestion } of split.recognised) {
    const key = `${value}\u0000${suggestion}`
    const group = groupsByKey.get(key)
    if (group) group.rows.push(row)
    else groupsByKey.set(key, { from: value, to: suggestion, rows: [row] })
  }
  const groups = [...groupsByKey.values()].sort((a, b) => b.rows.length - a.rows.length)

  return {
    issueKey,
    column: issue.column,
    groups,
    total: split.recognised.length,
    untouched: split.unrecognised,
    untouchedTotal: split.unrecognisedTotal,
  }
}

export function applyBulk(plan: BulkPlan): ChangeEntry | undefined {
  if (plan.total === 0) return undefined
  const col = columnIndex(plan.column)
  const cells = plan.groups.flatMap((group) => group.rows.map((row) => ({ row, col, newValue: group.to })))
  return applyChange(`${issueByKey(plan.issueKey).title}: ${plan.total.toLocaleString('en-US')} values`, cells)
}
