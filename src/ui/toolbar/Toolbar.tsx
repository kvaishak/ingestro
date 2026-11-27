import { store, isLoaded } from '../../store/store'
import { query } from '../../store/query'
import { issueByKey } from '../../validation/catalog'
import { formatCount } from '../../format'
import { clearIssueFilter, startImport } from '../actions'
import { SearchBox } from './SearchBox'
import { RevertAllButton } from './RevertAllButton'

/** Top bar: search, the active problem filter, row count, revert and import. Sort lives in the grid's column headers. */
export function Toolbar() {
  return (
    <div className="toolbar">
      <SearchBox />
      <IssueFilterChip />
      <span className="spacer" />
      <RowCount />
      <RevertAllButton />
      <ImportButton />
    </div>
  )
}

/** "Showing: <problem>" with an ✕ to go back to every row. Hidden when no problem is selected. */
function IssueFilterChip() {
  if (!query.issueKey) return null
  const issue = issueByKey(query.issueKey)
  return (
    <span className="chip" data-testid="filterchip">
      Showing: {issue.title}
      <button onClick={clearIssueFilter} title="Show all rows" aria-label="Show all rows">✕</button>
    </span>
  )
}

/** "1,234 rows", or "12 of 1,234 rows" while a search or problem filter narrows the view. */
function RowCount() {
  const total = store.rowCount
  const isNarrowed = Boolean(query.search || query.issueKey)
  const text = isNarrowed ? `${formatCount(store.view.length)} of ${formatCount(total)} rows` : `${formatCount(total)} rows`
  return <span className="hint" data-testid="rowcount">{text}</span>
}

/** Disabled until the file is loaded and no problem is left: there is no partial import. */
function ImportButton() {
  const problemsLeft = store.problemCells
  return (
    <button
      className="btn primary"
      disabled={!isLoaded() || problemsLeft > 0}
      title={problemsLeft > 0 ? `${formatCount(problemsLeft)} problems left` : 'Import'}
      onClick={startImport}
      data-testid="import"
    >
      Import
    </button>
  )
}
