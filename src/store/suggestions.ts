import { columnIndex } from '../validation/columns'
import { issueByKey } from '../validation/catalog'
import { store } from './store'

/**
 * For one problem type, which flagged values can the tool suggest a fix for, and which can it not?
 * Computed on demand from the current data: one walk over the rows carrying that code.
 * Memoised per store version so the panel can ask freely.
 */

export interface RecognisedValue {
  row: number
  value: string
  suggestion: string
}

export interface UnrecognisedSpelling {
  value: string
  count: number
}

export interface SuggestionSplit {
  recognised: RecognisedValue[]
  /** Distinct spellings we cannot map, most frequent first. */
  unrecognised: UnrecognisedSpelling[]
  unrecognisedTotal: number
}

let cache: { version: number; issueKey: string; split: SuggestionSplit } | null = null

export function splitBySuggestion(issueKey: string): SuggestionSplit {
  if (cache && cache.version === store.version && cache.issueKey === issueKey) return cache.split
  const split = computeSplit(issueKey)
  cache = { version: store.version, issueKey, split }
  return split
}

function computeSplit(issueKey: string): SuggestionSplit {
  const issue = issueByKey(issueKey)
  const column = columnIndex(issue.column)
  const columnFlags = store.flags[column]

  const recognised: RecognisedValue[] = []
  const unrecognisedCounts = new Map<string, number>()

  for (let row = 0; row < store.rowCount; row++) {
    if (columnFlags[row] !== issue.code) continue
    const value = store.rows[row][column]
    const suggestion = issue.suggest?.(value)
    if (suggestion !== undefined) recognised.push({ row, value, suggestion })
    else unrecognisedCounts.set(value, (unrecognisedCounts.get(value) ?? 0) + 1)
  }

  const unrecognised = [...unrecognisedCounts]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count)
  const unrecognisedTotal = unrecognised.reduce((sum, u) => sum + u.count, 0)

  return { recognised, unrecognised, unrecognisedTotal }
}
